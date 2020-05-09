import _ from "lodash";
import React from "react";
import { hasCorrectTokens, hashConfiguration, makeGoogleRequest } from "../../shared/google-auth";
import { Link } from "react-router-dom";
import { ExternalLink } from "../../components/external-link";
import logo from "./logo.png";
import qs from "qs";
import SafeHtmlElement from "../../components/safe-html-element";
import IFrame from "../../components/iframe";
import Highlighter from "../../components/highlighter";
import { Button, Callout, H4, Tag } from "@blueprintjs/core";
import { DateTime } from "luxon";

import styles from "./gmail.module.css";
import { Time } from "../../components/time";
import { PaginatedResults } from "../../components/paginated-results/paginated-results";
import {
  DATE_FILTERS,
  DATE_FILTERS_DESCRIPTION,
  DateFilter,
} from "../../components/filters/filters";

const GMAIL_SCOPE = "https://www.googleapis.com/auth/gmail.readonly";
const GMAIL_V1 = "https://www.googleapis.com/gmail/v1";
const GMAIL_BATCH_V1 = "https://www.googleapis.com/batch/gmail/v1";

const iframeStyle = `<style>
  body {
      background-color: #ffffff;
      font-family: -apple-system, "BlinkMacSystemFont", "Segoe UI", "Roboto", "Oxygen", "Ubuntu", "Cantarell", "Open Sans", "Helvetica Neue", "Icons16", sans-serif;
  }

  span[data-markjs] {
      color: unset;
      background: #fdedbe;
  }

  .no-highlight span[data-markjs] {
      background-color: unset !important;
  }
</style>`;

// e.g. Thu, 7 Mar 2019 11:53:55 -0800
function parseMessageDate(dateString) {
  return DateTime.fromFormat(dateString, "EEE, d MMM y HH:mm:ss ZZZ").toISO();
}

// https://stackoverflow.com/a/30106551/4981712
function b64DecodeUnicode(str) {
  // Going backwards: from bytestream, to percent-encoding, to original string.
  return decodeURIComponent(
    atob(str.replace(/_/g, "/").replace(/-/g, "+"))
      .split("")
      .map(function (c) {
        return "%" + ("00" + c.charCodeAt(0).toString(16)).slice(-2);
      })
      .join("")
  );
}

function GmailMessage({ message, searchData, shouldExpand = false }) {
  const [isExpanded, setIsExpanded] = React.useState(shouldExpand);
  const headers = _.keyBy(message.payload.headers, "name");
  let parts = _.keyBy(message.payload.parts, "mimeType");

  if (parts["multipart/alternative"]) {
    parts = _.keyBy(parts["multipart/alternative"].parts, "mimeType");
  }

  const encodedBody = parts["text/html"]?.body.data ?? parts["text/plain"]?.body.data ?? null;

  return (
    <div className={styles.gmailMessage}>
      <H4>{headers.Subject?.value}</H4>
      <div style={{ display: "flex" }}>
        <Tag minimal>{`From: ${headers.From?.value}`}</Tag>
        <div style={{ flexGrow: 1 }} />
        <Time iso={parseMessageDate(headers.Date?.value)} />
      </div>

      {encodedBody ? (
        <>
          <IFrame initialSize={250} shouldExpand={isExpanded} className={styles.messageIframe}>
            <Highlighter text={searchData.input}>
              <SafeHtmlElement html={b64DecodeUnicode(encodedBody) + iframeStyle} />
            </Highlighter>
          </IFrame>
          {!isExpanded && (
            <div>
              <Button
                className={styles.expandButton}
                fill
                minimal
                onClick={() => setIsExpanded(true)}
              >
                Expand
              </Button>
            </div>
          )}
          <div>
            <ExternalLink href={`http://mail.google.com/mail/#inbox/${message.id}`}>
              View in browser
            </ExternalLink>
          </div>
        </>
      ) : (
        <Callout intent="danger">Unable to render this message</Callout>
      )}
    </div>
  );
}

function GmailDetailComponent({ item, searchData }) {
  return (
    <div style={{ paddingTop: "10px" }}>
      {item.messages.map((message) => (
        <GmailMessage
          key={message.id}
          message={message}
          searchData={searchData}
          shouldExpand={item.messages.length === 1}
        />
      ))}
    </div>
  );
}

function GmailItem({ item }) {
  const { snippet, id, messages } = item;
  const messageSnippet = document.createElement("textarea");
  messageSnippet.innerHTML = snippet;

  const headers = _.keyBy(messages[0].payload.headers, "name");

  return (
    <>
      <p>{headers.Subject?.value}</p>
      <SafeHtmlElement html={messageSnippet?.value} />
      <ExternalLink href={`http://mail.google.com/mail/#inbox/${id}`}>View email</ExternalLink>
    </>
  );
}

/**
 * Use a batch request to get all the specified threads at once
 * See https://developers.google.com/gmail/api/guides/batch
 * @param {string} accessToken
 * @param {array} threads
 * @return {Promise<any>}
 */
async function getThreads(accessToken, threads = []) {
  const threadsById = _.keyBy(threads, "id");

  const response = await fetch(GMAIL_BATCH_V1, {
    headers: {
      "Content-Type": "multipart/mixed; boundary=batch_boundary",
      Authorization: `Bearer ${accessToken}`,
    },
    method: "POST",
    body: `${threads
      .map(
        (thread) => `--batch_boundary
Content-Type: application/http
Content-ID: ${thread.id}

GET /gmail/v1/users/me/threads/${thread.id}
`
      )
      .join("")}
--batch_boundary--`,
  });

  const body = await response.text();

  const messages = body.split("--batch_");
  messages.shift();
  messages.pop();

  return Object.fromEntries(
    messages.map((message) => {
      const [, responseId] = /^Content-ID: (.*)$/gm.exec(message);
      let content = "";
      try {
        content = JSON.parse(message.substring(message.indexOf("{")).trim());
      } catch (e) {
        content = { snippet: "Error when parsing message" };
      }

      const threadId = responseId.split("response-")[1];
      return [threadId, Object.assign(content, { snippet: threadsById[threadId].snippet })];
    })
  );
}

const gmailResultRenderer = ({ pages }) => {
  return _.flatten(
    pages.map(({ threads }) => {
      return threads?.map((item) => ({
        key: item.id,
        component: <GmailItem key={item.id} item={item} />,
        item: item,
      }));
    })
  );
};

function makeGmailFetcher(configuration) {
  return async (key, { input, pageSize, dateFilter }, cursor) => {
    let query = input;
    if (dateFilter !== DATE_FILTERS.ANYTIME) {
      query += ` after:${DATE_FILTERS_DESCRIPTION[dateFilter].date()}`;
    }

    const url = `${GMAIL_V1}/users/me/threads?${qs.stringify({
      q: query,
      maxResults: pageSize ?? 5,
      pageToken: cursor,
    })}`;

    const { threads, nextPageToken } = await makeGoogleRequest({
      configuration,
      scope: GMAIL_SCOPE,
      url,
    });

    return {
      threads: _.map(
        await getThreads(configuration.nested.accessToken.get(), threads),
        (content) => content
      ),
      nextPageToken,
    };
  };
}

export default function GmailSearchResults({ configuration, searchViewState }) {
  const searchData = searchViewState.get();
  const { pageSize } = configuration.get();
  const [dateFilter, setDateFilter] = React.useState(DATE_FILTERS.ANYTIME);

  return (
    <PaginatedResults
      searchViewState={searchViewState}
      logo={logo}
      queryKey={[
        `gmail${hashConfiguration(configuration)}`,
        { input: searchData.input, dateFilter, pageSize },
      ]}
      fetcher={makeGmailFetcher(configuration)}
      renderPages={gmailResultRenderer}
      globalError={
        hasCorrectTokens(configuration.get()) === false && (
          <div>
            Not authenticated. Go to the <Link to="/settings">settings</Link> to setup the Gmail
            module.
          </div>
        )
      }
      configuration={configuration}
      getFetchMore={({ nextPageToken }) => nextPageToken ?? null}
      itemDetailRenderer={(item) => <GmailDetailComponent item={item} searchData={searchData} />}
      filters={
        <div style={{ flexGrow: 1 }}>
          <DateFilter value={dateFilter} setter={setDateFilter} />
        </div>
      }
    />
  );
}
