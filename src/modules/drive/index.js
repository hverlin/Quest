import React from "react";
import { hasCorrectTokens, makeGoogleRequest, hashConfiguration } from "../../shared/google-auth";
import { Link } from "react-router-dom";
import { Time } from "../../components/time";
import { PaginatedSearchResults } from "../../components/search-results";
import { ExternalLink } from "../../components/external-link";
import { Button, Card, Spinner, Tooltip } from "@blueprintjs/core";
import logo from "./logo.png";
import useSWR from "swr";
import qs from "qs";
import { Document, Page } from "react-pdf";
import styles from "./drive.module.css";

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
  const [numPages, setNumPages] = React.useState(false);
  const [currentPage, setCurrentPage] = React.useState(1);

  const onDocumentLoadSuccess = ({ numPages }) => {
    setNumPages(numPages);
  };

  const {
    name,
    iconLink,
    webViewLink,
    modifiedTime,
    thumbnailLink,
    hasThumbnail,
    exportLinks,
  } = item;

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
      {exportLinks && exportLinks["application/pdf"] && (
        <Card>
          <Document
            className={styles.document}
            file={{
              url: `https://www.googleapis.com/drive/v3/files/${item.id}/export?${qs.stringify({
                mimeType: "application/pdf",
              })}`,
              httpHeaders: { Authorization: `Bearer ${configuration.nested.accessToken.get()}` },
            }}
            onLoadSuccess={onDocumentLoadSuccess}
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
          </Document>
        </Card>
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
