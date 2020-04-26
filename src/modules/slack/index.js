import useSWR from "swr";
import _ from "lodash";
import React from "react";
import { Time } from "../../components/time";
import { PaginatedSearchResults } from "../../components/search-results";
import { ExternalLink } from "../../components/external-link";
import { Card } from "@blueprintjs/core";
import logo from "./logo.svg";
import EmojiJS from "emoji-js";
import SafeHtmlElement from "../../components/safe-html-element";

const emojiConverter = new EmojiJS();
const rx_colons = new RegExp(":([a-zA-Z0-9-_+]+):", "g");

function slackMessageParser(message, usersById, emojis) {
  if (!message?.text) {
    return "";
  }

  const renderedMessage = message.text
    .replace(/```([\s\S]*?)```/g, `<pre style="white-space: pre-wrap; padding: 5px">$1</pre>`)
    .replace(
      /`([\s\S]*?)`/g,
      `<pre style="white-space: pre-wrap; display: inline; padding: 2px">$1</pre>`
    )
    .replace(rx_colons, (match, p1) => {
      if (!emojis[p1]) {
        return match;
      }
      return `<img src="${emojis[p1]}" style="width:1rem;height:1rem;" alt="emoji"/>`;
    })
    .replace(/<http([^|]*?)\|?([^|]*?)>/gm, (match, p1, p2) => {
      return p1 ? `<a href="http${p1}">${p2}</a>` : `<a href="http${p2}">http${p2}</a>`;
    })
    .replace(/<@([A-Z0-9]+)>/gm, (match, p1) => {
      const linkToUser = `slack://user?id=${p1}&team=${message.team}`;
      return `<a href="${linkToUser}" >@${_.get(usersById, [p1, "real_name"], p1)}</a>`;
    })
    .replace(/<#([A-Z\d]+)\|(.*?)>/g, `<a href="slack://channel?team=${message.team}&id=$1">$2</a>`)
    .replace(/<!here>/g, `<em>@here</em>`)
    .replace(/<!channel>/g, `<em>@channel</em>`)
    .replace(/<!everyone>/g, `<em>@everyone</em>`)
    .replace(/\*(.*?)\*/g, `<b>$1</b>`)
    .replace(/_(\s*?)_/g, `<em>$1</em>`)
    .replace(/~(\s*?)~/g, `<span style="text-decoration: line-through;">@everyone</span>`)
    .replace(
      /^>(.*?)$/gm,
      `<blockquote style="margin: 0; border-left: 4px solid #b3b3b3; padding-left: 4px; display: inline-block">$1</blockquote>`
    );

  return emojiConverter.replace_colons(renderedMessage);
}

async function getUsers(token) {
  const res = await fetch(`https://slack.com/api/users.list?token=${token}`);
  return res.json();
}

async function getEmojis(token) {
  const res = await fetch(`https://slack.com/api/emoji.list?token=${token}`);
  return res.json();
}

const getUsersMemo = _.memoize(getUsers);
const getEmojisMemo = _.memoize(getEmojis);

function SlackMessage({ message = {}, users, emojis, showChannel = false }) {
  const timestamp = message?.ts?.split(".")[0];

  return (
    <>
      <p style={{ maxHeight: 300, overflowY: "auto" }}>
        <b>{_.get(users, [message.user, "real_name"], message.username)}</b>:{" "}
        <SafeHtmlElement
          style={{ whiteSpace: "pre-wrap" }}
          tag="span"
          html={slackMessageParser(message, users, emojis)}
        />
      </p>
      {showChannel && (
        <p>
          in{" "}
          <ExternalLink href={`slack://channel?id=${message?.channel?.id}&team=${message.team}`}>
            {_.get(users, [message?.channel?.name, "real_name"], message?.channel?.name)}
          </ExternalLink>{" "}
          | {timestamp && <Time seconds={timestamp} />} |{" "}
          <ExternalLink href={message?.permalink}>View in Slack</ExternalLink>
        </p>
      )}
    </>
  );
}

function SlackDetail({ item, users, emojis }) {
  return (
    <div>
      {_.compact([item?.previous_2, item.previous, item]).map((item, i, arr) => {
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
            <SlackMessage message={item} users={users} emojis={emojis} showChannel={isLast} />
          </Card>
        );
      })}
    </div>
  );
}

function getSlackPage(token, pageSize, searchData, users, emojis) {
  return (wrapper) => ({ offset = 1, withSWR }) => {
    const { data, error } = withSWR(
      useSWR(
        `https://slack.com/api/search.messages?query=${searchData.input}&token=${token}&count=${
          pageSize || 5
        }&page=${offset || 1}`
      )
    );

    if (error) {
      return wrapper({ error, item: null });
    }

    if (!data?.messages?.matches) {
      return wrapper({ item: null });
    }

    return data?.messages?.matches.map((message) =>
      wrapper({
        key: message.ts,
        component: <SlackMessage message={message} users={users} emojis={emojis} showChannel />,
        item: message,
      })
    );
  };
}

export default function SlackSearchResults({ configuration, searchViewState }) {
  const { token, pageSize } = configuration.get();
  const searchData = searchViewState.get();

  const [users, setUsers] = React.useState([]);
  const [emojis, setEmojis] = React.useState([]);

  React.useEffect(() => {
    getUsersMemo(token).then((u) => setUsers(u.members));
    getEmojisMemo(token).then((e) => setEmojis(e.emoji));
  }, []);

  const usersById = _.keyBy(users, "id");

  return (
    <PaginatedSearchResults
      searchViewState={searchViewState}
      logo={logo}
      configuration={configuration}
      computeNextOffset={({ data }) => {
        if (!data?.messages) {
          return null;
        }
        const { page, pages } = data.messages.paging;
        return pages > page ? page + 1 : null;
      }}
      itemDetailRenderer={(item) => (
        <SlackDetail token={token} item={item} users={usersById} emojis={emojis} />
      )}
      pageFunc={getSlackPage(token, pageSize, searchData, usersById, emojis)}
      deps={[usersById, emojis]}
      getTotal={(pageSWRs) => _.get(pageSWRs, [0, "data", "messages", "total"], null)}
    />
  );
}
