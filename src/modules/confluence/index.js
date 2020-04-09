import useSWR from "swr";
import _ from "lodash";
import React from "react";
import styles from "../../components/search-results.module.css";
import { Card } from "@blueprintjs/core";
import { SearchCard } from "../../components/search-card";

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

function parseConfluenceMessage(message) {
  return message.replace(/@@@hl@@@(.*?)@@@endhl@@@/gm, `<b>$1</b>`);
}

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
    <SearchCard configuration={configuration}>
      {_.take(data?.results, 5).map((result) => (
        <Card interactive key={result.content.id}>
          <a target="_blank" href={url + result.url}>
            {result.content.title}
          </a>
          <p
            dangerouslySetInnerHTML={{
              __html: parseConfluenceMessage(result.excerpt),
            }}
          />
          Updated {result.friendlyLastModified}
        </Card>
      ))}
    </SearchCard>
  );
}
