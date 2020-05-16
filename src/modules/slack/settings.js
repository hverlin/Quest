import React from "react";
import ConfigurationForm from "../../components/configuration-form";
import { Button, FormGroup } from "@blueprintjs/core";
import { remote } from "electron";
import qs from "qs";
import { parse } from "url";
import { useStateLink } from "@hookstate/core";
import { notify } from "../../services/notification-service";
import log from "electron-log";
import { getDefaultForProperty } from "../../shared/configuration-utils";

function signInWithPopup(configuration) {
  const http = require("http");

  const {
    clientId,
    clientSecret,
    redirectPort = getDefaultForProperty("slack", "redirectPort"),
  } = configuration.get();

  const authWindow = new remote.BrowserWindow({ width: 600, height: 800, show: true });
  const redirectUri = `http://localhost:${redirectPort}`;

  let httpServer;
  try {
    httpServer = http.createServer(async (req, res) => {
      res.writeHead(200, { "Content-Type": "html" });
      const { query } = parse(req.url);
      res.end("loading...");

      const code = qs.parse(query).code;
      if (!code) {
        authWindow.close();
        return;
      }

      try {
        const r = await fetch(
          "https://slack.com/api/oauth.access?" +
            qs.stringify({
              code,
              client_id: clientId,
              redirect_uri: redirectUri,
              client_secret: clientSecret,
            })
        );

        const body = await r.json();
        configuration.nested.token.set(body.access_token);
        configuration.nested.userId.set(body.user_id);
        notify("Authentication to Slack successful");
      } catch (e) {
        notify("Failure when authenticating to Slack");
        log.error(e);
      } finally {
        authWindow.close();
      }
    });

    httpServer.listen(redirectPort, "127.0.0.1");

    const authUrl = `https://slack.com/oauth/authorize?${qs.stringify({
      client_id: clientId,
      redirect_uri: redirectUri,
      scope: "users:read search:read emoji:read",
    })}`;

    authWindow.on("closed", () => {
      try {
        httpServer.close();
      } catch (e) {
        log.warn("unable to close http server", e);
      }
    });

    authWindow.loadURL(authUrl);
  } catch (e) {
    if (httpServer) {
      httpServer.close();
    }
  }
}

async function revokeToken(configuration) {
  await fetch(
    `https://slack.com/api/auth.revoke?${qs.stringify({
      token: configuration.get().token,
    })}`
  );
  configuration.nested.token.set("");
}

// noinspection JSUnusedGlobalSymbols
export default function SlackSettings({ configurationState }) {
  const config = useStateLink(configurationState);
  const { clientId, clientSecret, token } = config.get();

  return (
    <form>
      <ConfigurationForm
        configuration={config}
        fields={["clientId", "clientSecret", "pageSize", "sortBy"]}
        isForm={false}
      />
      <FormGroup>
        {token ? (
          <Button onClick={() => revokeToken(configurationState)}>Sign Out</Button>
        ) : (
          <Button
            disabled={!clientId && !clientSecret}
            onClick={() => signInWithPopup(configurationState)}
          >
            Authorize
          </Button>
        )}
      </FormGroup>
    </form>
  );
}
