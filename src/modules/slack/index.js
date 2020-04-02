import useSWR from "swr";
import _ from "lodash";
import React from "react";
import { getSlackToken } from "./auth";

export default function SlackSearchResults({ searchData = {} }) {
  const [token, setToken] = React.useState(null);

  React.useEffect(() => {
    getSlackToken().then(setToken);
  }, []);

  const { data, error } = useSWR(() =>
    token
      ? `https://slack.com/api/search.messages?query=${searchData.input}&token=${token}`
      : null
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
