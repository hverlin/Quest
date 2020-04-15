import React from "react";
import { loadGoogleDriveClient } from "./auth";
import { Link } from "react-router-dom";
import { Time } from "../../components/time";
import { PaginatedSearchResults } from "../../components/search-results";
import { SKELETON } from "@blueprintjs/core/lib/cjs/common/classes";
import { ExternalLink } from "../../components/external-link";
import { Card, H2, Tooltip } from "@blueprintjs/core";
import logo from "./logo.png";
import ReactMarkdown from "react-markdown";
import log from "electron-log";
import useSWR from "swr";

function DriveItemRender({ item }) {
  const { name, webViewLink, iconLink, modifiedTime } = item;
  return (
    <>
      <p>
        <Tooltip content={name}>
          <img src={iconLink} alt="file icon" />
        </Tooltip>
        {"  "}
        <ExternalLink href={webViewLink}>{name}</ExternalLink>
      </p>
      <p>
        Last updated <Time time={modifiedTime} />
      </p>
    </>
  );
}

function DriveDetailComponent({ item }) {
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

function listFiles({ isSignedIn, searchData, configuration, pageToken }) {
  return new Promise((resolve, reject) => {
    if (!isSignedIn) {
      return;
    }
    window.gapi.client.drive.files
      .list({
        q: `name contains '${searchData.input}'`,
        pageSize: 5,
        fields: "nextPageToken, files(id, name, iconLink, modifiedTime, webViewLink)",
        pageToken,
      })
      .then(resolve)
      .catch((e) => {
        log.error(e);
        if (e?.status !== 401) {
          reject(e);
        }

        configuration.nested.accessToken.set(null);
        loadGoogleDriveClient(
          configuration,
          () =>
            listFiles({ isSignedIn: true, searchData, configuration }).then(resolve).catch(reject),
          { logInIfUnauthorized: false }
        );
      });
  });
}

const googleDriveFetcher = (configuration) => async (searchData, isSignedIn, cursor) => {
  return listFiles({ isSignedIn, searchData, configuration, pageToken: cursor });
};

function getGoogleDrivePage(searchData, isSignedIn, configuration) {
  return (wrapper) => ({ offset: cursor = null, withSWR }) => {
    const { data, error } = withSWR(
      useSWR([searchData, isSignedIn, cursor], googleDriveFetcher(configuration))
    );

    if (error) {
      return wrapper({ error, item: null });
    }

    if (!data?.result?.files) {
      return wrapper({ item: null });
    }

    return data?.result?.files.map((item) =>
      wrapper({
        key: item.id,
        component: <DriveItemRender item={item} />,
        item,
      })
    );
  };
}

export default function DriveSearchResults({ searchData = {}, configuration, searchViewState }) {
  const [isSignedIn, setIsSignedIn] = React.useState(null);

  React.useEffect(() => {
    loadGoogleDriveClient(configuration, setIsSignedIn, {
      logInIfUnauthorized: false,
    });
  }, [isSignedIn]);

  return (
    <PaginatedSearchResults
      searchViewState={searchViewState}
      searchData={searchData}
      logo={logo}
      itemDetailRenderer={(item) => <DriveDetailComponent item={item} />}
      error={
        isSignedIn === false ? (
          <div>
            Not authenticated. Go to the <Link to="/settings">settings</Link> to setup the Google
            Drive module.
          </div>
        ) : null
      }
      configuration={configuration}
      pageFunc={getGoogleDrivePage(searchData, isSignedIn, configuration)}
      computeNextOffset={({ data }) =>
        data?.result?.nextPageToken ? data.result.nextPageToken : null
      }
      deps={[isSignedIn]}
    />
  );
}
