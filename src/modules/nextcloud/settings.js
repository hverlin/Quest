import React from "react";
import ConfigurationForm from "../../components/configuration-form";
import { Button, Callout, FormGroup } from "@blueprintjs/core";
import { useStateLink } from "@hookstate/core";
import { remote } from "electron";
import { notify } from "../../services/notification-service";
import log from "electron-log";
import { useQuery } from "react-query";

async function signIn(configuration) {
  const { url } = configuration.get();

  const res = await fetch(url + "/index.php/login/v2", {
    credentials: "omit",
    method: "POST",
    headers: {
      Content: "application/json",
      Origin: url,
    },
  });

  const authInfos = await res.json();

  const authWindow = new remote.BrowserWindow({ width: 600, height: 800, show: true });

  let authDisplayed = true;
  let authenticated = false;

  authWindow.on("closed", () => {
    authDisplayed = false;
  });

  authWindow.loadURL(authInfos.login);

  const { token, endpoint } = authInfos.poll;

  while (authDisplayed && !authenticated) {
    await new Promise((resolve) => {
      setTimeout(() => resolve(), 1000);
    });
    try {
      const authCheck = await fetch(endpoint, {
        credentials: "omit",
        method: "POST",
        headers: {
          "Content-Type": "application/x-www-form-urlencoded",
          Origin: url,
        },
        body: `token=${token}`,
      });
      if (!authCheck.ok) {
        continue;
      }
      const result = await authCheck.json();
      if (result) {
        authenticated = true;
        configuration.nested.username.set(result.loginName);
        configuration.nested.password.set(result.appPassword);
        notify("Authentication to Nextcloud successful");
        authWindow.close();
      }
    } catch (err) {
      log.error(err);
    }
  }
}

async function signOut(configuration) {
  const { url, username, password } = configuration.get();
  try {
    const revokeRes = await fetch(url + "/ocs/v2.php/core/apppassword?format=json", {
      credentials: "omit",
      method: "DELETE",
      headers: {
        Authorization: `Basic ${btoa(`${username}:${password}`)}`,
        "OCS-APIREQUEST": true,
        Origin: url,
      },
    });
    const { ocs } = await revokeRes.json();
    if (ocs?.meta?.status !== "ok") {
      throw Error("Invalid status response");
    }
    notify("Logout to Nextcloud successful");
  } catch (err) {
    log.error(err);
    notify("Unable to revoke Nextcloud app password");
  } finally {
    configuration.nested.username.set("");
    configuration.nested.password.set("");
  }
}

// noinspection JSUnusedGlobalSymbols
export default function NextcloudSettings({ configurationState }) {
  const config = useStateLink(configurationState);
  const { url, basic, username, password } = config.get();
  const { data } = useQuery(
    url && username && password ? `${url}/index.php/apps/quest/api/0.1/check` : null,
    async (requestUrl) => {
      try {
        const res = await fetch(requestUrl, {
          credentials: "omit",
          headers: {
            Authorization: `Basic ${btoa(`${username}:${password}`)}`,
            Content: "application/json",
            Origin: url,
          },
        });
        const check = await res.json();
        return check?.status === "ok";
      } catch (e) {
        return false;
      }
    }
  );

  return (
    <form>
      <ConfigurationForm
        configuration={config}
        fields={["url", "pageSize", "basic"]}
        isForm={false}
      />
      {basic ? (
        <ConfigurationForm
          configuration={config}
          fields={["username", "password"]}
          isForm={false}
        />
      ) : (
        <FormGroup>
          {username && password ? (
            <Button onClick={() => signOut(config)}>Sign Out</Button>
          ) : (
            <Button disabled={!url} onClick={() => signIn(config)}>
              Authorize
            </Button>
          )}
        </FormGroup>
      )}
      {data === false && (
        <Callout intent={"danger"}>
          Nextcloud Quest application not available, please install it before using this module! See
          documentation for more details.
        </Callout>
      )}
    </form>
  );
}
