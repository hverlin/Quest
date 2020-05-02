import _ from "lodash";
import React from "react";
import { hasCorrectTokens, hashConfiguration, makeGoogleRequest } from "../../shared/google-auth";
import { Link } from "react-router-dom";
import { PaginatedSearchResults } from "../../components/search-results";
import { ExternalLink } from "../../components/external-link";
import logo from "./logo.png";
import useSWR from "swr";
import qs from "qs";
import SafeHtmlElement from "../../components/safe-html-element";
import IFrame from "../../components/iframe";
import Highlighter from "../../components/highlighter";
import { Callout, H3 } from "@blueprintjs/core";

const GMAIL_SCOPE = "https://www.googleapis.com/auth/gmail.readonly";
const GMAIL_V1 = "https://www.googleapis.com/gmail/v1";
const GMAIL_BATCH_V1 = "https://www.googleapis.com/batch/gmail/v1";

const iframeStyle = `<style>
  body {
      background-color: #ffffff;
  }

  span[data-markjs] {
      color: unset;
      background: #fdedbe;
  }

  .no-highlight span[data-markjs] {
      background-color: unset !important;
  }
</style>`;

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

function GmailMessage({ message, searchData }) {
  const headers = _.keyBy(message.payload.headers, "name");
  let parts = _.keyBy(message.payload.parts, "mimeType");

  if (parts["multipart/alternative"]) {
    parts = _.keyBy(parts["multipart/alternative"].parts, "mimeType");
  }

  const encodedBody = parts["text/html"]?.body.data ?? parts["text/plain"]?.body.data ?? null;

  return (
    <div style={{ paddingBottom: "5px" }}>
      <H3>{headers.Subject.value}</H3>
      {encodedBody ? (
        <IFrame style={{ width: "100%", height: "400px", border: "none", borderRadius: 3 }}>
          <Highlighter text={searchData.input}>
            <SafeHtmlElement html={b64DecodeUnicode(encodedBody) + iframeStyle} />
          </Highlighter>
        </IFrame>
      ) : (
        <Callout intent="danger">Unable to render this message</Callout>
      )}
      <ExternalLink href={`http://mail.google.com/mail/#inbox/${message.id}`}>
        View in browser
      </ExternalLink>
    </div>
  );
}

function GmailDetailComponent({ item, searchData }) {
  return (
    <div style={{ paddingTop: "10px" }}>
      {item.messages.map((m, index) => (
        <GmailMessage key={index} message={m} searchData={searchData} />
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
      <p>{headers.Subject.value}</p>
      <SafeHtmlElement html={messageSnippet.value} />
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

const gmailFetcher = (configuration) => async (url) => {
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

function getGmailPage(searchData, configuration) {
  return (wrapper) => ({ offset: cursor = null, withSWR }) => {
    const url = `${GMAIL_V1}/users/me/threads?${qs.stringify({
      q: searchData.input,
      maxResults: configuration.nested.pageSize.get() ?? 5,
      pageToken: cursor,
    })}`;

    const { data, error } = withSWR(
      useSWR([url, hashConfiguration(configuration)], gmailFetcher(configuration))
    );

    if (error) {
      return wrapper({ error, item: null });
    }

    if (!data) {
      return wrapper({ item: null });
    }

    return _.isArray(data?.threads)
      ? data.threads.map((item) =>
          wrapper({
            key: item.id,
            component: <GmailItem item={item} />,
            item,
          })
        )
      : wrapper({ error: "test", item: null });
  };
}

export default function GmailSearchResults({ configuration, searchViewState }) {
  const searchData = searchViewState.get();

  return (
    <PaginatedSearchResults
      searchViewState={searchViewState}
      logo={logo}
      error={
        hasCorrectTokens(configuration.get()) === false ? (
          <div>
            Not authenticated. Go to the <Link to="/settings">settings</Link> to setup the Gmail
            module.
          </div>
        ) : null
      }
      configuration={configuration}
      pageFunc={getGmailPage(searchData, configuration)}
      computeNextOffset={({ data }) => data?.nextPageToken ?? null}
      itemDetailRenderer={(item) => <GmailDetailComponent item={item} searchData={searchData} />}
    />
  );
}
