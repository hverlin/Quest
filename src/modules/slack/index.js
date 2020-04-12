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
import EmojiJS from "emoji-js";

const emojiConverter = new EmojiJS();

domPurify.addHook("afterSanitizeAttributes", (node) => {
  if ("target" in node) {
    node.setAttribute("target", "_blank");
  }
});

function slackMessageParser(message, usersById) {
  if (!message?.text) {
    return "";
  }

  const urlRegex = /<http(.*?)>/gm;
  const userRegex = /<@([A-Z0-9]+)>/gm;

  return emojiConverter
    .replace_colons(message.text)
    .replace(urlRegex, `<a href="http$1">http$1</a>`)
    .replace(userRegex, (match, p1) => {
      const linkToUser = `slack://user?id=${p1}&team=${message.team}`;
      console.log(linkToUser);
      return `<a href="${linkToUser}" >@${_.get(
        usersById,
        [p1, "real_name"],
        p1
      )}</a>`;
    });
}

async function getUsers(token) {
  const res = await fetch(`https://slack.com/api/users.list?token=${token}`);
  return res.json();
}

const getUsersMemo = _.memoize(getUsers);

function SlackMessage({
  message = {},
  users,
  isLoading = false,
  showChannel = false,
}) {
  console.log(message, users);
  const timestamp = message?.ts?.split(".")[0];

  return (
    <>
      <p className={isLoading ? SKELETON : ""}>
        <b>{_.get(users, [message.user, "real_name"], message.username)}</b>:{" "}
        <span
          style={{ whiteSpace: "pre-wrap" }}
          dangerouslySetInnerHTML={{
            __html: domPurify.sanitize(slackMessageParser(message, users), {
              ALLOW_UNKNOWN_PROTOCOLS: true,
            }),
          }}
        />
      </p>
      {showChannel && (
        <p className={isLoading ? SKELETON : ""}>
          in{" "}
          <ExternalLink
            href={`slack://channel?id=${message?.channel?.id}&team=${message.team}`}
          >
            {_.get(
              users,
              [message?.channel?.name, "real_name"],
              message?.channel?.name
            )}
          </ExternalLink>{" "}
          |{" "}
          {timestamp && (
            <Time time={new Date(+`${timestamp[0]}000`).toISOString()} />
          )}
        </p>
      )}
    </>
  );
}

function SlackDetail({ item, users }) {
  return (
    <div>
      {_.compact([item?.previous_2, item.previous, item]).map(
        (item, i, arr) => {
          const isLast = arr.length - 1 === i;
          return (
            <Card
              key={item.ts}
              style={{
                marginTop: "10px",
                padding: "10px",
                wordBreak: "break-word",
                marginLeft: isLast ? "" : "15px",
              }}
            >
              <SlackMessage message={item} users={users} showChannel={isLast} />
            </Card>
          );
        }
      )}
    </div>
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

  const usersById = _.keyBy(users, "id");

  return (
    <SearchResults
      logo={logo}
      error={error || (data && !data.ok)}
      configuration={configuration}
      total={data?.messages?.total}
      items={data?.messages?.matches}
      itemDetailRenderer={(item) => (
        <SlackDetail token={token} item={item} users={usersById} />
      )}
      itemRenderer={(item, { isLoading } = {}) => {
        return (
          <SlackMessage
            message={item}
            users={usersById}
            isLoading={isLoading}
            showChannel
          />
        );
      }}
    />
  );
}
