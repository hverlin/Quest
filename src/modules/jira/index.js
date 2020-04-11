import useSWR from "swr";
import React from "react";
import { Time } from "../../components/time";
import { SearchResults } from "../../components/search-results";
import { SKELETON } from "@blueprintjs/core/lib/cjs/common/classes";
import { ExternalLink } from "../../components/external-link";

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

function resultItem(url) {
  return (issue, { isLoading = false } = {}) => {
    const {
      key,
      fields: {
        issuetype,
        summary,
        assignee,
        status,
        reporter,
        created,
        updated,
      } = {},
    } = issue;

    return (
      <>
        <p className={isLoading ? SKELETON : ""}>
          <img src={issuetype?.iconUrl} alt="test" />
          {"  "}
          <ExternalLink target="_blank" href={url + "/browse/" + key}>
            {key}
          </ExternalLink>{" "}
          - {summary}
        </p>
        <p className={isLoading ? SKELETON : ""}>
          Created: <Time time={created} /> | Updated: <Time time={updated} /> |{" "}
          {assignee?.displayName} | {status?.name} | reported by{" "}
          {reporter?.displayName}
        </p>
      </>
    );
  };
}

export default function JiraSearchResults({ searchData = {}, configuration }) {
  const { username, password, url } = configuration.get();

  const { data, error } = useSWR(
    () =>
      url ? `${url}/rest/api/2/search?jql=text+~+"${searchData.input}"` : null,
    jiraFetcher({ username, password })
  );

  return (
    <SearchResults
      error={
        !url
          ? "JIRA module is not configured correctly. URL is missing."
          : error
      }
      configuration={configuration}
      total={data?.total}
      items={data?.issues}
      itemRenderer={(item, { isLoading = false } = {}) =>
        resultItem(url)(item, { isLoading })
      }
    />
  );
}
