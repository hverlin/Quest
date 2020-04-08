import useSWR from "swr";
import _ from "lodash";
import React from "react";
import styles from "../../components/search-results.module.css";
import { Card } from "@blueprintjs/core";
import { Time } from "../../components/time";

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

  if (error) {
    return <div>Failed to load</div>;
  }

  if (!data) {
    return <div>Loading Dropbox Paper results...</div>;
  }

  console.log(data);

  return (
    <div className={styles.results}>
      {_.take(data?.matches, 5).map(
        ({
          metadata: {
            metadata: { id, name, server_modified },
          },
        }) => (
          <Card key={id} interactive>
            <p>{name}</p>
            <p>
             Last updated <Time time={server_modified} />
            </p>
          </Card>
        )
      )}
    </div>
  );
}
