import useSWR from "swr";
import React from "react";
import { Time } from "../../components/time";
import { SearchResults } from "../../components/search-results";
import { SKELETON } from "@blueprintjs/core/lib/cjs/common/classes";
import { ExternalLink } from "../../components/external-link";
import logo from "./logo.svg";
import { Tooltip } from "@blueprintjs/core";

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

function JiraResultItem({ issue, isLoading, url }) {
  const {
    key,
    fields: { issuetype, summary, assignee, status, reporter, created, updated } = {},
  } = issue;

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

export default function JiraSearchResults({ searchData = {}, configuration }) {
  const { username, password, url } = configuration.get();

  const { data, error } = useSWR(
    () => (url ? `${url}/rest/api/2/search?jql=text+~+"${searchData.input}"` : null),
    jiraFetcher({ username, password })
  );

  return (
    <SearchResults
      logo={logo}
      error={!url ? "JIRA module is not configured correctly. URL is missing." : error}
      configuration={configuration}
      total={data?.total}
      items={data?.issues}
      itemRenderer={(item, { isLoading = false } = {}) => (
        <JiraResultItem url={url} item={item} isLoading={isLoading} />
      )}
    />
  );
}
