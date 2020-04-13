import useSWR from "swr";
import React from "react";
import { PaginatedSearchResults } from "../../components/search-results";
import { SKELETON } from "@blueprintjs/core/lib/cjs/common/classes";
import { ExternalLink } from "../../components/external-link";
import _ from "lodash";
import domPurify from "dompurify";
import logo from "./logo.svg";

const pageSize = 5;

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

function ConfluenceDetail({ item, username, password }) {
  const link = `${_.get(item, "content._links.self")}?expand=body.view`;

  const { data, error } = useSWR(link, confluenceFetcher({ username, password }));

  if (error) {
    return <p>Failed to load document: {link}</p>;
  }

  return (
    <div
      className={!data ? SKELETON : ""}
      dangerouslySetInnerHTML={{
        __html: domPurify.sanitize(data?.body.view.value),
      }}
    />
  );
}

function ConfluenceItem({ item = {}, url }) {
  const { content = {}, excerpt, friendlyLastModified, url: itemUrl } = item;
  return (
    <>
      <p>
        <ExternalLink href={url + itemUrl}>{content.title}</ExternalLink>
      </p>
      <p
        dangerouslySetInnerHTML={{
          __html: domPurify.sanitize(parseConfluenceMessage(excerpt)),
        }}
      />
      <p>Updated {friendlyLastModified}</p>
    </>
  );
}

function getConfluencePage(url, searchData, username, password) {
  return (wrapper) => ({ offset = 0, withSWR }) => {
    const { data, error } = withSWR(
      useSWR(
        () =>
          url
            ? `${url}/rest/api/search?cql=(siteSearch ~ "${
                searchData.input
              }" and space = "ENG" and type = "page")&start=${offset || 0}&limit=${pageSize}`
            : null,
        confluenceFetcher({ username, password })
      )
    );

    if (error) {
      return wrapper({ error, item: null });
    }

    if (!data) {
      return wrapper({ item: null });
    }

    return data?.results.map((issue) =>
      wrapper({
        component: <ConfluenceItem key={issue.key} url={url} item={issue} />,
        item: issue,
      })
    );
  };
}

export default function ConfluenceSearchResults({ searchData = {}, configuration }) {
  const { username, password, url } = configuration.get();

  return (
    <PaginatedSearchResults
      searchData={searchData}
      logo={logo}
      error={!url ? "Confluence module is not configured correctly. URL is missing." : null}
      configuration={configuration}
      itemDetailRenderer={(item) => (
        <ConfluenceDetail item={item} username={username} password={password} />
      )}
      computeNextOffset={({ data }) =>
        data && data.totalSize > data.start + data.size ? data.start + pageSize : null
      }
      pageFunc={getConfluencePage(url, searchData, username, password)}
    />
  );
}
