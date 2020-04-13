import useSWR from "swr";
import React from "react";
import { Time } from "../../components/time";
import { PaginatedSearchResults } from "../../components/search-results";
import { SKELETON } from "@blueprintjs/core/lib/cjs/common/classes";
import { ExternalLink } from "../../components/external-link";
import logo from "./logo.svg";
import { Tooltip } from "@blueprintjs/core";

const pageSize = 5;

const jiraFetcher = ({ username, password }) => async (url) => {
  const res = await fetch(url, {
    credentials: "omit",
    headers: {
      Authorization: `Basic ${btoa(`${username}:${password}`)}`,
      Accept: "application/json",
    },
  });

  return res.json();
};

function JiraResultItem({ item = {}, isLoading, url }) {
  const {
    key,
    fields: { issuetype, summary, assignee, status, reporter, created, updated } = {},
  } = item;

  return (
    <>
      <p className={isLoading ? SKELETON : ""}>
        <Tooltip content={issuetype?.name}>
          <img src={issuetype?.iconUrl} alt={issuetype?.name} style={{ verticalAlign: "middle" }} />
        </Tooltip>
        {"  "}
        <ExternalLink target="_blank" href={url + "/browse/" + key}>
          {key}
        </ExternalLink>{" "}
        - {summary}
      </p>
      <p className={isLoading ? SKELETON : ""}>
        Created: <Time time={created} /> | Updated: <Time time={updated} /> |{" "}
        {assignee?.displayName} | {status?.name} | reported by {reporter?.displayName}
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
        component: <JiraResultItem key={issue.key} url={url} item={issue} />,
        item: issue,
      })
    );
  };
}

export default function JiraSearchResults({ searchData = {}, configuration }) {
  const { username, password, url } = configuration.get();

  return (
    <PaginatedSearchResults
      searchData={searchData}
      logo={logo}
      error={!url ? "JIRA module is not configured correctly. URL is missing." : null}
      configuration={configuration}
      computeNextOffset={({ data }) =>
        data && data.total > data.startAt + data.issues.length ? data.startAt + pageSize : null
      }
      itemDetailRenderer={(item) => <JiraResultItem url={url} item={item} />}
      pageFunc={getJiraPage(url, searchData, username, password)}
    />
  );
}
