import _ from "lodash";
import React from "react";
import { hasCorrectTokens, makeGoogleRequest, hashConfiguration } from "../../shared/google-auth";
import { Link } from "react-router-dom";
import { Time } from "../../components/time";
import { PaginatedSearchResults } from "../../components/search-results";
import { ExternalLink } from "../../components/external-link";
import { Classes, Button, Spinner, Tab, Tabs, Tooltip, Callout } from "@blueprintjs/core";
import logo from "./logo.png";
import useSWR from "swr";
import qs from "qs";
import { Document, Page } from "react-pdf/dist/entry.webpack";

import styles from "./drive.module.css";
import ReactMarkdown from "react-markdown";

const DRIVE_SCOPE = "https://www.googleapis.com/auth/drive.readonly";

const MIME_TYPES = {
  TEXT: "text/plain",
  PDF: "application/pdf",
};

const formatFetcher = async (itemId, accessToken, mimeType) => {
  const res = await fetch(
    `https://www.googleapis.com/drive/v3/files/${itemId}/export?${qs.stringify({ mimeType })}`,
    { headers: { Authorization: `Bearer ${accessToken}` } }
  );

  return mimeType === MIME_TYPES.TEXT ? res.text() : res.blob();
};

function PDFView({ configuration, item }) {
  const [numPages, setNumPages] = React.useState(0);
  const [currentPage, setCurrentPage] = React.useState(1);
  const { data } = useSWR(
    [item.id, configuration.nested.accessToken.get(), MIME_TYPES.PDF],
    formatFetcher
  );
  const { thumbnailLink, hasThumbnail } = item;

  React.useEffect(() => {
    setNumPages(0);
    setCurrentPage(1);
  }, [item]);

  if (!data) {
    return (
      <div className={styles.preview}>
        {hasThumbnail && <img src={thumbnailLink} alt="Preview" />}
        <Spinner />
      </div>
    );
  }
  return (
    <div className={styles.pdfView}>
      <div className={styles.navigation}>
        <Button
          disabled={currentPage <= 1}
          icon={"chevron-left"}
          minimal={true}
          onClick={() => setCurrentPage(currentPage - 1)}
        />
        <p>
          Page {currentPage} of {numPages}
        </p>
        <Button
          disabled={currentPage >= numPages}
          icon={"chevron-right"}
          minimal={true}
          onClick={() => setCurrentPage(currentPage + 1)}
        />
      </div>
      <Document
        className={styles.document}
        file={data}
        onLoadSuccess={({ numPages }) => setNumPages(numPages)}
        loading={
          <div className={styles.preview}>
            {hasThumbnail && <img src={thumbnailLink} alt="Preview" />}
            <Spinner />
          </div>
        }
      >
        <Page
          className={styles.page}
          pageNumber={currentPage}
          loading={
            <div className={styles.preview}>
              {hasThumbnail && <img src={thumbnailLink} alt="Preview" />}
              <Spinner />
            </div>
          }
        />
      </Document>
    </div>
  );
}

function TextView({ item, configuration }) {
  const { data, error } = useSWR(
    [item.id, configuration.nested.accessToken.get(), MIME_TYPES.TEXT],
    formatFetcher
  );

  if (!data) {
    return <Spinner />;
  }

  return (
    <div style={{ whiteSpace: "pre-wrap", paddingTop: "10px" }}>
      {error ? (
        <Callout>Preview cannot be loaded.</Callout>
      ) : (
        <p className={Classes.RUNNING_TEXT}>{data && <ReactMarkdown source={data} />}</p>
      )}
    </div>
  );
}

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
  const [currentTab, setCurrentTab] = React.useState(MIME_TYPES.TEXT);

  const {
    name,
    iconLink,
    webViewLink,
    modifiedTime,
    exportLinks,
    hasThumbnail,
    thumbnailLink,
  } = item;

  const supportedFormats = new Set(_.isObject(exportLinks) ? Object.keys(exportLinks) : []);

  React.useEffect(() => {
    if (!supportedFormats.has(currentTab)) {
      const mimeType = Object.values(MIME_TYPES).find((mimeTypes) =>
        supportedFormats.has(mimeTypes)
      );
      setCurrentTab(mimeType);
    }
  }, [item]);

  return (
    <div>
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
      {currentTab ? (
        <Tabs id="FormatTabs" onChange={setCurrentTab} selectedTabId={currentTab}>
          {supportedFormats.has(MIME_TYPES.TEXT) && (
            <Tab
              id={MIME_TYPES.TEXT}
              title="Text"
              panel={<TextView item={item} configuration={configuration} />}
            />
          )}
          {supportedFormats.has(MIME_TYPES.PDF) && (
            <Tab
              id={MIME_TYPES.PDF}
              title="PDF"
              panel={<PDFView item={item} configuration={configuration} />}
            />
          )}
        </Tabs>
      ) : (
        <div>
          {hasThumbnail ? (
            <img src={thumbnailLink} alt="Preview" />
          ) : (
            <Callout>Unable to render this document</Callout>
          )}
        </div>
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
      q: `name contains '${searchData.input}' or fullText contains '${searchData.input}'`,
      pageSize: configuration.nested.pageSize.get() ?? 5,
      fields:
        "nextPageToken, files(id, name, iconLink, modifiedTime, webViewLink, thumbnailLink, hasThumbnail, exportLinks)",
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
