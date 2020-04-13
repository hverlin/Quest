import React from "react";
import { loadGoogleDriveClient } from "./auth";
import { Link } from "react-router-dom";
import { Time } from "../../components/time";
import { SearchResults } from "../../components/search-results";
import { SKELETON } from "@blueprintjs/core/lib/cjs/common/classes";
import { ExternalLink } from "../../components/external-link";
import { Card, H2, Tooltip } from "@blueprintjs/core";
import logo from "./logo.png";
import ReactMarkdown from "react-markdown";
import log from "electron-log";

function driveItemRender(
  { name, webViewLink, iconLink, modifiedTime },
  { isLoading = false } = {}
) {
  return (
    <>
      <p className={isLoading ? SKELETON : ""}>
        <Tooltip content={name}>
          <img src={iconLink} alt="file icon" />
        </Tooltip>
        {"  "}
        <ExternalLink href={webViewLink}>{name}</ExternalLink>
      </p>
      <p className={isLoading ? SKELETON : ""}>
        Last updated <Time time={modifiedTime} />
      </p>
    </>
  );
}

function DriveResultItem({ item }) {
  const [data, setData] = React.useState();
  const [error, setError] = React.useState();

  React.useEffect(() => {
    async function fetchData() {
      const response = await window.gapi.client.drive.files.export({
        fileId: item.id,
        mimeType: "text/plain",
      });
      setData(response.body);
    }
    fetchData().catch((e) => {
      setError(e);
    });
  }, [item.id]);

  return (
    <div style={{ whiteSpace: "pre-wrap", paddingTop: "10px" }}>
      {!error && (
        <>
          <H2 className={!data ? SKELETON : ""}>{item.name}</H2>
          <p className={!data ? SKELETON : ""}>{data && <ReactMarkdown source={data} />}</p>
        </>
      )}
      {error && <Card>Preview cannot be loaded.</Card>}
    </div>
  );
}

export default function DriveSearchResults({ searchData = {}, configuration }) {
  const [isSignedIn, setIsSignedIn] = React.useState(null);
  const [error, setError] = React.useState(null);
  const [data, setData] = React.useState(null);

  React.useEffect(() => {
    loadGoogleDriveClient(configuration, setIsSignedIn, {
      logInIfUnauthorized: false,
    });
  }, [isSignedIn]);

  React.useEffect(() => {
    async function listFiles() {
      if (!isSignedIn) {
        return;
      }

      try {
        const response = await window.gapi.client.drive.files.list({
          q: `name contains '${searchData.input}'`,
          pageSize: 5,
          fields: "nextPageToken, files(id, name, iconLink, modifiedTime, webViewLink)",
        });
        setData(response);
      } catch (e) {
        log.error(e);
        if (e?.status === 401) {
          configuration.nested.accessToken.set(null);
          await loadGoogleDriveClient(configuration, setIsSignedIn, {
            logInIfUnauthorized: false,
          });
          return listFiles();
        }
        setError(e);
      }
    }

    listFiles();
  }, [searchData, isSignedIn]);

  if (isSignedIn === false) {
    return (
      <div>
        Not authenticated. Go to the <Link to="/settings">settings</Link> to setup the Google Drive
        module.
      </div>
    );
  }

  return (
    <SearchResults
      logo={logo}
      itemDetailRenderer={(item) => <DriveResultItem item={item} />}
      error={error}
      configuration={configuration}
      items={data?.result?.files}
      itemRenderer={driveItemRender}
    />
  );
}
