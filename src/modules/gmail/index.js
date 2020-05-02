import _ from "lodash";
import React from "react";
import { hasCorrectTokens, hashConfiguration, makeGoogleRequest } from "../../shared/google-auth";
import { Link } from "react-router-dom";
import { PaginatedSearchResults } from "../../components/search-results";
import { ExternalLink } from "../../components/external-link";
import logo from "./logo.png";
import useSWR from "swr";
import qs from "qs";

const GMAIL_SCOPE = "https://www.googleapis.com/auth/gmail.readonly";
const GMAIL_V1 = "https://www.googleapis.com/gmail/v1";
const GMAIL_BATCH_V1 = "https://www.googleapis.com/batch/gmail/v1";

function GmailItem({ item }) {
  const { snippet, threadId, payload } = item;
  const messageSnippet = document.createElement("textarea");
  messageSnippet.innerHTML = snippet;

  const headers = _.keyBy(payload.headers, "name");

  return (
    <>
      <p>{headers.Subject.value}</p>
      <p>{messageSnippet.value}</p>
      <ExternalLink href={`http://mail.google.com/mail/#inbox/${threadId}`}>
        View email
      </ExternalLink>
    </>
  );
}

/**
 * Use a batch request to get all the specified messages at once
 * See https://developers.google.com/gmail/api/guides/batch
 * @param {string} accessToken
 * @param {array} messageIds
 * @return {Promise<any>}
 */
async function getMessages(accessToken, messageIds = []) {
  const response = await fetch(GMAIL_BATCH_V1, {
    headers: {
      "Content-Type": "multipart/mixed; boundary=batch_boundary",
      Authorization: `Bearer ${accessToken}`,
    },
    method: "POST",
    body: `${messageIds
      .map(
        (id) => `--batch_boundary
Content-Type: application/http
Content-ID: ${id}

GET /gmail/v1/users/me/messages/${id}
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
        content = "Error when parsing message";
      }

      return [responseId.split("response-")[1], content];
    })
  );
}

const gmailFetcher = (configuration) => async (url) => {
  const { messages, nextPageToken } = await makeGoogleRequest({
    configuration,
    scope: GMAIL_SCOPE,
    url,
  });

  return {
    messages: _.map(
      await getMessages(configuration.nested.accessToken.get(), _.map(messages, "id")),
      (content) => content
    ),
    nextPageToken,
  };
};

function getGmailPage(searchData, configuration) {
  return (wrapper) => ({ offset: cursor = null, withSWR }) => {
    const url = `${GMAIL_V1}/users/me/messages?${qs.stringify({
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

    return _.isArray(data?.messages)
      ? data.messages.map((item) =>
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
    />
  );
}
