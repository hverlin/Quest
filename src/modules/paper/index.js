import useSWR from "swr";
import _ from "lodash";
import React from "react";
import { Time } from "../../components/time";
import { PaginatedSearchResults } from "../../components/search-results";
import { SKELETON } from "@blueprintjs/core/lib/cjs/common/classes";
import { ExternalLink } from "../../components/external-link";
import ReactMarkdown from "react-markdown";
import logo from "./logo.svg";

const paperDetailFetcher = (token) => async (id) => {
  const res = await fetch("https://api.dropboxapi.com/2/paper/docs/download", {
    method: "POST",
    credentials: "omit",
    headers: {
      Authorization: `Bearer ${token}`,
      "Dropbox-API-Arg": JSON.stringify({
        doc_id: id,
        export_format: "markdown",
      }),
    },
  });

  return res.text();
};

const paperFetcher = (token) => async (url, searchData, cursor = null) => {
  const res = await fetch(`${url}${cursor ? "/continue" : ""}_v2`, {
    method: "POST",

    credentials: "omit",
    headers: {
      Authorization: `Bearer ${token}`,
      Accept: "application/json",
      "Content-type": "application/json",
    },
    body: JSON.stringify(
      cursor
        ? { cursor }
        : {
            query: searchData?.input,
            include_highlights: false,
            options: { max_results: 5 },
          }
    ),
  });

  return res.json();
};

function PaperResultItem({
  item: { metadata: { metadata: { id, name, server_modified } = {} } = {} } = {},
  isLoading = false,
}) {
  return (
    <>
      <p className={isLoading ? SKELETON : ""}>
        <ExternalLink href={`https://paper.dropbox.com/${id}`}>{name}</ExternalLink>
      </p>
      <p className={isLoading ? SKELETON : ""}>
        Last updated <Time time={server_modified} />
      </p>
    </>
  );
}

function PaperDocDetail({ item, token }) {
  const id = _.get(item, "metadata.metadata.id");

  const { data, error } = useSWR(id, paperDetailFetcher(token));

  if (error) {
    return <p>Failed to load document: {id}</p>;
  }

  return <div className={!data ? SKELETON : ""}>{data && <ReactMarkdown source={data} />}</div>;
}

function getPaperPage(token, searchData) {
  return (wrapper) => ({ offset: cursor = null, withSWR }) => {
    const { data, error } = withSWR(
      useSWR([`https://api.dropboxapi.com/2/files/search`, searchData, cursor], paperFetcher(token))
    );

    if (error) {
      return wrapper({ error, item: null });
    }

    if (!data) {
      return wrapper({ item: null });
    }

    return data?.matches.map((item) =>
      wrapper({
        component: <PaperResultItem item={item} />,
        item,
      })
    );
  };
}

export default function PaperSearchResults({ searchData = {}, configuration }) {
  const { token } = configuration.get();

  return (
    <PaginatedSearchResults
      searchData={searchData}
      logo={logo}
      configuration={configuration}
      itemDetailRenderer={(item) => <PaperDocDetail item={item} token={token} />}
      deps={[token]}
      pageFunc={getPaperPage(token, searchData)}
      computeNextOffset={({ data }) => (data?.cursor ? data.cursor : null)}
    />
  );
}
