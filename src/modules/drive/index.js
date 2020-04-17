import React from "react";
import { loadGoogleDriveClient } from "./auth";
import { Link } from "react-router-dom";
import { Time } from "../../components/time";
import { PaginatedSearchResults } from "../../components/search-results";
import { ExternalLink } from "../../components/external-link";
import { Card, H2, Spinner, Tooltip } from "@blueprintjs/core";
import logo from "./logo.png";
import ReactMarkdown from "react-markdown";
import log from "electron-log";
import useSWR from "swr";

function DriveItemRender({ item }) {
  const { name, webViewLink, iconLink, modifiedTime } = item;
  return (
    <>
      <p>
        <Tooltip content={name} openOnTargetFocus={false}>
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
      setError(null);
      setData(null);
      const response = await window.gapi.client.drive.files.export({
        fileId: item.id,
        mimeType: "text/plain",
      });
      setData(response.body);
    }
    fetchData().catch((e) => setError(e));
  }, [item.id]);

  if (!data) {
    return <Spinner />;
  }

  return (
    <div style={{ whiteSpace: "pre-wrap", paddingTop: "10px" }}>
      {error ? (
        <Card>Preview cannot be loaded.</Card>
      ) : (
        <>
          <H2>{item.name}</H2>
          <p>{data && <ReactMarkdown source={data} />}</p>
        </>
      )}
    </div>
  );
}

async function listFiles({ searchData, configuration, pageToken, setIsSignedIn }) {
  const isAuthorized = await loadGoogleDriveClient(configuration, { logInIfUnauthorized: false });
  setIsSignedIn(isAuthorized);
  if (!isAuthorized) {
    return;
  }

  try {
    return await window.gapi.client.drive.files.list({
      q: `name contains '${searchData.input}'`,
      pageSize: 5,
      fields: "nextPageToken, files(id, name, iconLink, modifiedTime, webViewLink)",
      pageToken,
    });
  } catch (e) {
    log.error(e);
    if (e?.status !== 401) {
      throw e;
    }

    configuration.nested.accessToken.set(null);
    await loadGoogleDriveClient(configuration, { logInIfUnauthorized: false });
    return listFiles({ isSignedIn: true, searchData, configuration });
  }
}

const googleDriveFetcher = (configuration, setIsSignedIn) => async (searchData, cursor) => {
  return listFiles({ searchData, configuration, pageToken: cursor, setIsSignedIn });
};

function getGoogleDrivePage(searchData, isSignedIn, configuration, setIsSignedIn) {
  return (wrapper) => ({ offset: cursor = null, withSWR }) => {
    const { data, error } = withSWR(
      useSWR([searchData, cursor], googleDriveFetcher(configuration, setIsSignedIn))
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
      pageFunc={getGoogleDrivePage(searchData, isSignedIn, configuration, setIsSignedIn)}
      computeNextOffset={({ data }) =>
        data?.result?.nextPageToken ? data.result.nextPageToken : null
      }
      deps={[isSignedIn]}
    />
  );
}
