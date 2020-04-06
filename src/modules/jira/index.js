import useSWR from "swr";
import _ from "lodash";
import React from "react";

export const jiraFetcher = ({ username, password }) => async (url) => {
  const res = await fetch(url, {
    credentials: "omit",
    headers: {
      Authorization: `Basic ${btoa(`${username}:${password}`)}`,
      Accept: "application/json",
    },
  });

  return res.json();
};

export default function JiraSearchResults({ searchData = {}, configuration }) {
  const { username, password, url } = configuration.get();

  const { data, error } = useSWR(
    () =>
      url ? `${url}/rest/api/2/search?jql=text+~+${searchData.input}` : null,
    jiraFetcher({ username, password })
  );

  if (!url) {
    return <div>JIRA module is not configured correctly. URL is missing.</div>;
  }

  if (error) {
    return <div>Failed to load</div>;
  }

  if (!data) {
    return <div>Loading Jira issues...</div>;
  }

  return (
    <ul>
      {_.take(data?.issues, 5).map((issue) => (
        <li key={issue.id}>{issue.fields.summary}</li>
      ))}
    </ul>
  );
}
