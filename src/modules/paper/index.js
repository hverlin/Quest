import useSWR from "swr";
import _ from "lodash";
import React from "react";
import { getPaperToken } from "./auth";

const paperFetcher = async function (url, searchData) {
  const token = await getPaperToken();
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

export function PaperSearchResults({ searchData = {} }) {
  const { data, error } = useSWR(
    [`https://api.dropboxapi.com/2/files/search_v2`, searchData],
    paperFetcher
  );

  if (error) return <div>Failed to load</div>;
  if (!data) return <div>Loading Dropbox Paper results...</div>;
  return (
    <ul>
      {_.take(data?.matches, 5).map(
        ({
          metadata: {
            metadata: { id, name },
          },
        }) => (
          <li key={id}>{name}</li>
        )
      )}
    </ul>
  );
}
