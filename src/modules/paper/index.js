import useSWR from "swr";
import _ from "lodash";
import React from "react";
import { Time } from "../../components/time";
import { SearchResults } from "../../components/search-results";
import * as PropTypes from "prop-types";
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

const paperFetcher = (token) => async (url, searchData) => {
  const res = await fetch(url, {
    method: "POST",

    credentials: "omit",
    headers: {
      Authorization: `Bearer ${token}`,
      Accept: "application/json",
      "Content-type": "application/json",
    },
    body: JSON.stringify({
      query: searchData?.input,
      include_highlights: false,
      options: { max_results: 5 },
    }),
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

PaperResultItem.propTypes = {
  name: PropTypes.any,
  time: PropTypes.any,
};
export default function PaperSearchResults({ searchData = {}, configuration }) {
  const { token } = configuration.get();

  const { data, error } = useSWR(
    [`https://api.dropboxapi.com/2/files/search_v2`, searchData],
    paperFetcher(token)
  );

  return (
    <SearchResults
      logo={logo}
      error={error}
      configuration={configuration}
      items={data?.matches}
      itemDetailRenderer={(item) => <PaperDocDetail item={item} token={token} />}
      itemRenderer={(item, { isLoading } = {}) => (
        <PaperResultItem item={item} isLoading={isLoading} />
      )}
    />
  );
}
