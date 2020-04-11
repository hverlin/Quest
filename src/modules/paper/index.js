import useSWR from "swr";
import React from "react";
import { Time } from "../../components/time";
import { SearchResults } from "../../components/search-results";
import * as PropTypes from "prop-types";
import { SKELETON } from "@blueprintjs/core/lib/cjs/common/classes";

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
    }),
  });

  return res.json();
};

function PaperResultItem({
  item: { metadata: { metadata: { name, server_modified } = {} } = {} } = {},
  isLoading = false,
}) {
  return (
    <>
      <p className={isLoading ? SKELETON : ""}>{name}</p>
      <p className={isLoading ? SKELETON : ""}>
        Last updated <Time time={server_modified} />
      </p>
    </>
  );
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
      error={error}
      configuration={configuration}
      items={data?.matches}
      itemRenderer={(item, { isLoading } = {}) => (
        <PaperResultItem item={item} isLoading={isLoading} />
      )}
    />
  );
}
