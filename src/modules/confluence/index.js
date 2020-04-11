import useSWR from "swr";
import React from "react";
import { SearchResults } from "../../components/search-results";
import { SKELETON } from "@blueprintjs/core/lib/cjs/common/classes";
import { ExternalLink } from "../../components/external-link";

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
  return message && message.replace(/@@@hl@@@(.*?)@@@endhl@@@/gm, `<b>$1</b>`);
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

  console.log(data);

  return (
    <SearchResults
      error={
        !url
          ? "Confluence module is not configured correctly. URL is missing."
          : error
      }
      configuration={configuration}
      total={data?.totalSize}
      items={data?.results}
      itemRenderer={(
        { content = {}, excerpt, friendlyLastModified, url: itemUrl } = {},
        { isLoading = false } = {}
      ) => (
        <>
          <p className={isLoading ? SKELETON : ""}>
            <ExternalLink href={url + itemUrl}>{content.title}</ExternalLink>
          </p>
          <p
            dangerouslySetInnerHTML={{
              __html: parseConfluenceMessage(excerpt),
            }}
          />
          <p className={isLoading ? SKELETON : ""}>
            Updated {friendlyLastModified}
          </p>
        </>
      )}
    />
  );
}
