import useSWR from "swr";
import _ from "lodash";
import React from "react";
import { Card } from "@blueprintjs/core";
import styles from "../../components/search-results.module.css";
import { Time } from "../../components/time";

function slackMessageParser(message, usersById) {
  const urlRegex = /<http(.*)?>/gm;
  const userRegex = /<@([A-Z0-9]+)>/gm;

  return message
    .replace(urlRegex, `<a href="http$1">http$1</a>`)
    .replace(userRegex, (match, p1, p2) => {
      return `<a>@${_.get(usersById, [p1, "real_name"], p1)}</a>`;
    });
}

async function getUsers(token) {
  const res = await fetch(`https://slack.com/api/users.list?token=${token}`);
  return res.json();
}

const getUsersMemo = _.memoize(getUsers);

export default function SlackSearchResults({ searchData = {}, configuration }) {
  const { token } = configuration.get();
  const [users, setUsers] = React.useState([]);

  const { data, error } = useSWR(
    `https://slack.com/api/search.messages?query=${searchData.input}&token=${token}`
  );

  React.useEffect(() => {
    getUsersMemo(token).then((u) => setUsers(u.members));
  }, []);

  if (error || (data && !data.ok)) {
    return <div>Failed to load</div>;
  }

  if (!data) {
    return <div>Loading Slack Results...</div>;
  }

  const usersById = _.keyBy(users, "id");

  return (
    <div className={styles.results}>
      <p>
        Showing {_.size(data?.messages?.matches)} of {data.messages.total}{" "}
        results
      </p>

      {_.take(data?.messages?.matches, 5).map((message) => (
        <Card
          interactive
          key={message.iid}
          onClick={() => window.open(message.permalink)}
        >
          <p>
            <b>
              {_.get(usersById, [message.user, "real_name"], message.username)}
            </b>
            :{" "}
            <span
              style={{ whiteSpace: "pre-wrap" }}
              dangerouslySetInnerHTML={{
                __html: slackMessageParser(message.text, usersById),
              }}
            />
          </p>
          <p>
            in{" "}
            <a
              href={`slack://channel?id=${message.channel.id}&team=${message.team}`}
            >
              {" "}
              {message.channel.name}
            </a>{" "}
            |{" "}
            <Time
              time={new Date(+`${message.ts.split(".")[0]}000`).toISOString()}
            />
          </p>
        </Card>
      ))}
    </div>
  );
}
