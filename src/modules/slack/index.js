import useSWR from "swr";
import _ from "lodash";
import React from "react";
import { Time } from "../../components/time";
import { SearchResults } from "../../components/search-results";
import { SKELETON } from "@blueprintjs/core/lib/cjs/common/classes";
import { ExternalLink } from "../../components/external-link";
import domPurify from "dompurify";
import { Card } from "@blueprintjs/core";
import logo from "./logo.svg";

function slackMessageParser(message, usersById) {
  if (!message) {
    return "";
  }

  const urlRegex = /<http(.*?)>/gm;
  const userRegex = /<@([A-Z0-9]+)>/gm;

  return message
    .replace(urlRegex, `<a href="http$1" target="_blank">http$1</a>`)
    .replace(userRegex, (match, p1, p2) => {
      return `<a>@${_.get(usersById, [p1, "real_name"], p1)}</a>`;
    });
}

async function getUsers(token) {
  const res = await fetch(`https://slack.com/api/users.list?token=${token}`);
  return res.json();
}

const getUsersMemo = _.memoize(getUsers);

function SlackResultItem({
  object,
  isLoading,
  message: {
    channel = {},
    team = {},
    text = "",
    ts = "",
    user = {},
    username,
  } = {},
}) {
  return (
    <>
      <p className={isLoading ? SKELETON : ""}>
        <b>{_.get(object, [user, "real_name"], username)}</b>:{" "}
        <span
          style={{ whiteSpace: "pre-wrap" }}
          dangerouslySetInnerHTML={{
            __html: domPurify.sanitize(slackMessageParser(text, object)),
          }}
        />
      </p>
      <p className={isLoading ? SKELETON : ""}>
        in{" "}
        <ExternalLink href={`slack://channel?id=${channel.id}&team=${team}`}>
          {" "}
          {channel.name}
        </ExternalLink>{" "}
        | <Time time={new Date(+`${ts.split(".")[0]}000`).toISOString()} />
      </p>
    </>
  );
}

export default function SlackSearchResults({ searchData = {}, configuration }) {
  const { token } = configuration.get();
  const [users, setUsers] = React.useState([]);

  const { data, error } = useSWR(
    `https://slack.com/api/search.messages?query=${searchData.input}&token=${token}`
  );

  React.useEffect(() => {
    getUsersMemo(token).then((u) => setUsers(u.members));
  }, []);

  return (
    <SearchResults
      logo={logo}
      error={error || (data && !data.ok)}
      configuration={configuration}
      total={data?.messages?.total}
      items={data?.messages?.matches}
      itemRenderer={(item, { isLoading } = {}) => (
        <SlackResultItem
          message={item}
          isLoading={isLoading}
          object={_.keyBy(users, "id")}
        />
      )}
    />
  );
}
