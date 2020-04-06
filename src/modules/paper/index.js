import useSWR from "swr";
import _ from "lodash";
import React from "react";

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

export default function PaperSearchResults({ searchData = {}, configuration }) {
  const { token } = configuration.get();

  const { data, error } = useSWR(
    [`https://api.dropboxapi.com/2/files/search_v2`, searchData],
    paperFetcher(token)
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
