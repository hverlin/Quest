import useSWR from "swr";
import _ from "lodash";
import React from "react";

const confluenceFetcher = ({ username, password }) => async (url) => {
  const res = await fetch(url, {
    credentials: "omit",
    headers: {
      Authorization: `Basic ${btoa(`${username}:${password}`)}`,
      Accept: "application/json",
    },
  });
  return res.json();
};

export default function ConfluenceSearchResults({
  searchData = {},
  configuration,
}) {
  const { username, password, url } = configuration.get();

  const { data, error } = useSWR(
    () =>
      url
        ? `${url}/rest/api/search?cql=(siteSearch ~ "${searchData.input}" and space = "ENG" and type = "page")`
        : null,
    confluenceFetcher({ username, password })
  );

  if (!url) {
    return (
      <div>Confluence module is not configured correctly. URL is missing.</div>
    );
  }

  if (error) {
    return <div>Failed to load</div>;
  }

  if (!data) {
    return <div>Loading Confluence pages...</div>;
  }

  return (
    <ul>
      {_.take(data?.results, 5).map((result) => (
        <li key={result.content.id}>{result.content.title}</li>
      ))}
    </ul>
  );
}
