import _ from "lodash";
import React from "react";
import { Time } from "../../components/time";
import { ExternalLink } from "../../components/external-link";
import logo from "./logo.svg";
import { Card, Classes, H3, H4, Spinner, Tooltip } from "@blueprintjs/core";
import styles from "./jira.module.css";
import log from "electron-log";
import SafeHtmlElement from "../../components/safe-html-element";
import qs from "qs";
import { PaginatedResults } from "../../components/paginated-results/paginated-results";
import {
  DATE_FILTERS,
  DATE_FILTERS_DESCRIPTION,
  DateFilter,
  OwnerFilter,
  OWNERSHIP_FILTERS,
} from "../../components/filters/filters";
import { useQuery } from "react-query";

const appSession = require("electron").remote.session;

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
  const { data, error } = useQuery(
    `${item.self}?expand=names,renderedFields`,
    jiraFetcher({ username, password })
  );

  if (error) {
    log.error(error);
    return <p>Failed to load document: {item.key}</p>;
  }

  if (!data) {
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
          <ExternalLink href={`${url}/browse/${key}`}>{key}</ExternalLink> - {summary}
        </H3>
      </div>
      <p>
        <IssueType issuetype={issuetype} /> {issuetype?.name} | {status?.name} | Created:{" "}
        <Time iso={created} /> | Updated: <Time iso={updated} /> | Assigned to{" "}
        {assignee?.displayName} | reported by {reporter?.displayName}
      </p>
      {description && (
        <div className={Classes.RUNNING_TEXT}>
          <hr />
          <H4>Description</H4>
          <SafeHtmlElement html={description} />
        </div>
      )}
      {!_.isEmpty(comment.comments) && (
        <>
          <hr />
          <div className={styles.comments}>
            <H4>Comments</H4>
            {comment.comments?.map((comment) => (
              <Card key={comment.id} className={Classes.RUNNING_TEXT}>
                <b>{comment.author.displayName}</b> - {comment.updated}
                <SafeHtmlElement style={{ marginTop: 3 }} html={comment.body} />
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
        <ExternalLink href={url + "/browse/" + key}>{key}</ExternalLink> - {summary}
      </p>
      <p>
        {status?.name} | Created: <Time iso={created} /> | Updated: <Time iso={updated} /> |{" "}
        {assignee?.displayName} | reported by {reporter?.displayName}
      </p>
    </>
  );
}

const makeJiraRenderer = (url) => ({ pages }) => {
  return _.flatten(
    pages.map(({ issues }) => {
      return issues?.map((issue) => ({
        key: issue.key,
        component: <JiraResultItem key={issue.key} url={url} item={issue} />,
        item: issue,
      }));
    })
  );
};

async function jiraResultsFetcher(
  key,
  { input, owner, dateFilter, pageSize, username, password, baseUrl, filter },
  offset
) {
  const searchParams = qs.stringify({ startAt: offset || 0, maxResults: pageSize });
  const text = input.replace(/"/, '\\"');

  const isKey = input.match(/^[A-Z]{2}-.\d+$/);
  const jqlQuery = [];
  if (text.length > 0) {
    jqlQuery.push(`(text+~+"${text}"${isKey ? ` OR key = ${text}` : ""})`);
  }

  if (owner === OWNERSHIP_FILTERS.ME) {
    jqlQuery.push(`assignee = currentUser()`);
  } else if (owner === OWNERSHIP_FILTERS.OTHERS) {
    jqlQuery.push(`assignee != currentUser()`);
  }

  if (dateFilter !== DATE_FILTERS.ANYTIME) {
    jqlQuery.push(`updated > ${DATE_FILTERS_DESCRIPTION[dateFilter].date()}`);
  }

  if (filter) {
    jqlQuery.push(`(${filter})`);
  }

  const url = `${baseUrl}/rest/api/2/search?${searchParams}&jql=${jqlQuery.join(" AND ")}`;

  const res = await fetch(url, {
    credentials: "omit",
    headers: {
      Authorization: `Basic ${btoa(`${username}:${password}`)}`,
      Content: "application/json",
      Origin: url,
    },
  });

  if (res.headers.has("quest-cookie")) {
    const [name, value] = res.headers.get("quest-cookie").split(";")[0].split("=");
    await appSession.defaultSession.cookies.set({ url: baseUrl, name, httpOnly: true, value });
  }

  return res.json();
}

export default function JiraSearchResults({ configuration, searchViewState }) {
  const searchData = searchViewState.get();
  const { username, password, url, pageSize, filter } = configuration.get();
  const [owner, setOwner] = React.useState(OWNERSHIP_FILTERS.ANYONE);
  const [dateFilter, setDateFilter] = React.useState(DATE_FILTERS.ANYTIME);

  return (
    <PaginatedResults
      queryKey={[
        "jira",
        {
          input: searchData.input,
          owner,
          dateFilter,
          username,
          password,
          baseUrl: url,
          pageSize,
          filter,
        },
      ]}
      searchViewState={searchViewState}
      logo={logo}
      globalError={!url ? "JIRA module is not configured correctly. URL is missing." : null}
      configuration={configuration}
      getFetchMore={({ total, startAt }) =>
        total > startAt + pageSize ? startAt + pageSize : null
      }
      fetcher={jiraResultsFetcher}
      itemDetailRenderer={(item) => (
        <JiraDetail password={password} username={username} item={item} url={url} />
      )}
      renderPages={makeJiraRenderer(url)}
      getTotal={(pages) => _.get(pages, [0, "total"], null)}
      filters={
        <>
          <OwnerFilter value={owner} setter={setOwner} label="Assignee" />
          <DateFilter value={dateFilter} setter={setDateFilter} />
        </>
      }
    />
  );
}
