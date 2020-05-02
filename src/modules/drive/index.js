import React from "react";
import { hasCorrectTokens, makeGoogleRequest, hashConfiguration } from "../../shared/google-auth";
import { Link } from "react-router-dom";
import { Time } from "../../components/time";
import { PaginatedSearchResults } from "../../components/search-results";
import { ExternalLink } from "../../components/external-link";
import { Card, Classes, H2, Spinner, Tooltip } from "@blueprintjs/core";
import logo from "./logo.png";
import ReactMarkdown from "react-markdown";
import useSWR from "swr";
import qs from "qs";

const DRIVE_SCOPE = "https://www.googleapis.com/auth/drive.readonly";

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
        Last updated <Time iso={modifiedTime} />
      </p>
    </>
  );
}

function DriveDetailComponent({ item, configuration }) {
  const [data, setData] = React.useState();
  const [error, setError] = React.useState();

  React.useEffect(() => {
    async function fetchData() {
      setError(null);
      setData(null);

      const response = await fetch(
        `https://www.googleapis.com/drive/v3/files/${item.id}/export?${qs.stringify({
          mimeType: "text/plain",
        })}`,
        { headers: { Authorization: `Bearer ${configuration.nested.accessToken.get()}` } }
      );

      setData(await response.text());
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
          <p className={Classes.RUNNING_TEXT}>{data && <ReactMarkdown source={data} />}</p>
        </>
      )}
    </div>
  );
}

const googleDriveFetcher = (configuration) => async (url) => {
  return makeGoogleRequest({ configuration, scope: DRIVE_SCOPE, url });
};

function getGoogleDrivePage(searchData, configuration) {
  return (wrapper) => ({ offset: cursor = null, withSWR }) => {
    const url = `https://www.googleapis.com/drive/v3/files?${qs.stringify({
      q: `name contains '${searchData.input}'`,
      pageSize: configuration.nested.pageSize.get() ?? 5,
      fields: "nextPageToken, files(id, name, iconLink, modifiedTime, webViewLink)",
      pageToken: cursor,
    })}`;

    const { data, error } = withSWR(
      useSWR([url, hashConfiguration(configuration)], googleDriveFetcher(configuration))
    );

    if (error) {
      return wrapper({ error, item: null });
    }

    if (!data?.files) {
      return wrapper({ item: null });
    }

    return data?.files.map((item) =>
      wrapper({
        key: item.id,
        component: <DriveItemRender item={item} />,
        item,
      })
    );
  };
}

export default function DriveSearchResults({ configuration, searchViewState }) {
  const searchData = searchViewState.get();

  return (
    <PaginatedSearchResults
      searchViewState={searchViewState}
      logo={logo}
      itemDetailRenderer={(item) => (
        <DriveDetailComponent item={item} configuration={configuration} />
      )}
      error={
        hasCorrectTokens(configuration.get()) === false ? (
          <div>
            Not authenticated. Go to the <Link to="/settings">settings</Link> to setup the Google
            Drive module.
          </div>
        ) : null
      }
      configuration={configuration}
      pageFunc={getGoogleDrivePage(searchData, configuration)}
      computeNextOffset={({ data }) => data?.nextPageToken ?? null}
    />
  );
}
