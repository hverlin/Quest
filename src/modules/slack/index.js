import useSWR from "swr";
import _ from "lodash";
import React from "react";

export default function SlackSearchResults({ searchData = {}, configuration }) {
  const { token } = configuration.get();

  const { data, error } = useSWR(
    `https://slack.com/api/search.messages?query=${searchData.input}&token=${token}`
  );

  if (error || (data && !data.ok)) return <div>Failed to load</div>;
  if (!data) return <div>Loading Slack Results...</div>;
  return (
    <ul>
      {_.take(data?.messages?.matches, 5).map((message) => (
        <li key={message.iid}>{message.text}</li>
      ))}
    </ul>
  );
}
