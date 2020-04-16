import _ from "lodash";
import useSWR from "swr";
import React from "react";
import { Time } from "../../components/time";
import { PaginatedSearchResults } from "../../components/search-results";
import { ExternalLink } from "../../components/external-link";
import logo from "./logo.svg";
import { Card, H3, H4, Spinner, Tooltip } from "@blueprintjs/core";
import styles from "./jira.module.css";
import domPurify from "dompurify";
import log from "electron-log";

const appSession = require("electron").remote.session;

const pageSize = 5;

domPurify.addHook("afterSanitizeAttributes", (node) => {
  if ("target" in node) {
    node.setAttribute("target", "_blank");
  }
});

const jiraAuth = ({ username, password }) => async (url) => {
  const cookies = await appSession.defaultSession.cookies.get({ url, name: "JSESSIONID" });
  if (!_.isEmpty(cookies)) {
    return true;
  }

  const res = await fetch(`${url}/rest/auth/1/session`, {
    credentials: "omit",
    method: "post",
    headers: { "Content-type": "application/json" },
    body: JSON.stringify({ username, password }),
  });

  const { session } = await res.json();

  await appSession.defaultSession.cookies.set({
    url,
    name: session.name,
    httpOnly: true,
    value: session.value,
  });

  return true;
};

const jiraFetcher = ({ username, password }) => async (url) => {
  const res = await fetch(url, {
    credentials: "omit",
    headers: {
      Authorization: `Basic ${btoa(`${username}:${password}`)}`,
      Content: "application/json",
      Origin: url,
    },
  });

  return res.json();
};

function IssueType(props) {
  const { iconUrl, name } = props.issuetype;
  return (
    <Tooltip openOnTargetFocus={false} content={name}>
      <img src={iconUrl} alt={name} style={{ verticalAlign: "middle" }} />
    </Tooltip>
  );
}

function JiraDetail({ item, username, password, url }) {
  const { data: hasSession, error: sessionError } = useSWR(
    [url, item.id],
    jiraAuth({ username, password })
  );

  const { data, error } = useSWR(
    `${item.self}?expand=names,renderedFields`,
    jiraFetcher({ username, password })
  );

  if (error || sessionError) {
    log.error(error, sessionError);
    return <p>Failed to load document: {item.key}</p>;
  }

  if (!data || !hasSession) {
    return <Spinner />;
  }

  const {
    key,
    fields: { issuetype, summary, assignee, status, reporter, created, updated } = {},
  } = item;

  const { description, comment } = data.renderedFields;

  return (
    <div>
      <div>
        <H3>
          <ExternalLink target="_blank" href={`${url}/browse/${key}`}>
            {key}
          </ExternalLink>{" "}
          - {summary}
        </H3>
      </div>
      <p>
        <IssueType issuetype={issuetype} /> {issuetype?.name} | {status?.name} | Created:{" "}
        <Time time={created} /> | Updated: <Time time={updated} /> | Assigned to{" "}
        {assignee?.displayName} | reported by {reporter?.displayName}
      </p>
      {description && (
        <div>
          <hr />
          <H4>Description</H4>
          <div dangerouslySetInnerHTML={{ __html: domPurify.sanitize(description) }} />
        </div>
      )}
      {!_.isEmpty(comment.comments) && (
        <>
          <hr />
          <div className={styles.comments}>
            <H4>Comments</H4>
            {comment.comments.map((comment) => (
              <Card key={comment.id}>
                <b>{comment.author.displayName}</b> - {comment.updated}
                <div
                  style={{ marginTop: 3 }}
                  dangerouslySetInnerHTML={{ __html: domPurify.sanitize(comment.body) }}
                />
              </Card>
            ))}
          </div>
        </>
      )}
    </div>
  );
}

function JiraResultItem({ item = {}, url }) {
  const {
    key,
    fields: { issuetype, summary, assignee, status, reporter, created, updated } = {},
  } = item;

  return (
    <>
      <p>
        <IssueType issuetype={issuetype} />
        {"  "}
        <ExternalLink target="_blank" href={url + "/browse/" + key}>
          {key}
        </ExternalLink>{" "}
        - {summary}
      </p>
      <p>
        {status?.name} | Created: <Time time={created} /> | Updated: <Time time={updated} /> |{" "}
        {assignee?.displayName} | reported by {reporter?.displayName}
      </p>
    </>
  );
}

function getJiraPage(url, searchData, username, password) {
  return (wrapper) => ({ offset = 0, withSWR }) => {
    const { data, error } = withSWR(
      useSWR(
        () =>
          url
            ? `${url}/rest/api/2/search?jql=text+~+"${searchData.input}"&startAt=${
                offset || 0
              }&maxResults=${pageSize}`
            : null,
        jiraFetcher({ username, password })
      )
    );

    if (error) {
      return wrapper({ error, item: null });
    }

    if (!data) {
      return wrapper({ item: null });
    }

    return data?.issues.map((issue) =>
      wrapper({
        key: issue.key,
        component: <JiraResultItem key={issue.key} url={url} item={issue} />,
        item: issue,
      })
    );
  };
}

export default function JiraSearchResults({ searchData = {}, configuration, searchViewState }) {
  const { username, password, url } = configuration.get();

  return (
    <PaginatedSearchResults
      searchViewState={searchViewState}
      searchData={searchData}
      logo={logo}
      error={!url ? "JIRA module is not configured correctly. URL is missing." : null}
      configuration={configuration}
      computeNextOffset={({ data }) =>
        data && data.total > data.startAt + data.issues.length ? data.startAt + pageSize : null
      }
      itemDetailRenderer={(item) => (
        <JiraDetail password={password} username={username} item={item} url={url} />
      )}
      pageFunc={getJiraPage(url, searchData, username, password)}
    />
  );
}
