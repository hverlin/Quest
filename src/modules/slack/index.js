import _ from "lodash";
import React from "react";
import { Time } from "../../components/time";
import { ExternalLink } from "../../components/external-link";
import { Card } from "@blueprintjs/core";
import logo from "./logo.svg";
import EmojiJS from "emoji-js";
import SafeHtmlElement from "../../components/safe-html-element";
import {
  DATE_FILTERS,
  DATE_FILTERS_DESCRIPTION,
  DateFilter,
  Filter,
} from "../../components/filters/filters";
import { PaginatedResults } from "../../components/paginated-results/paginated-results";

const OWNERSHIP_FILTERS = {
  ANYONE: "anyone",
  ME: "me",
};

const OWNERSHIP_FILTERS_DESCRIPTION = {
  [OWNERSHIP_FILTERS.ANYONE]: { value: "Anyone" },
  [OWNERSHIP_FILTERS.ME]: { value: "me" },
};

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

async function fetchMessages(
  key,
  { input, userId, token, pageSize, owner, dateFilter },
  offset = 1
) {
  let query = input;
  if (owner === OWNERSHIP_FILTERS.ME) {
    query += ` from:${userId}`;
  }

  if (dateFilter !== DATE_FILTERS.ANYTIME) {
    query += ` after:${DATE_FILTERS_DESCRIPTION[dateFilter].date()}`;
  }

  if (query.length === 0) {
    query = "after:1990"; // return most recent messages in case the query is empty
  }

  const res = await fetch(
    `https://slack.com/api/search.messages?query=${query}&token=${token}&count=${
      pageSize || 5
    }&page=${offset}`,
    { headers: { accept: "application/json" } }
  );
  return res.json();
}

const slackResultsRenderer = (users, emojis) => ({ pages }) => {
  return _.flatten(
    pages.map(({ messages }) => {
      return messages?.matches.map((message) => ({
        key: message.ts,
        component: (
          <SlackMessage
            key={message.ts}
            message={message}
            users={users}
            emojis={emojis}
            showChannel
          />
        ),
        item: message,
      }));
    })
  );
};

export default function SlackSearchResults({ configuration, searchViewState }) {
  const { token, pageSize, userId } = configuration.get();
  const searchData = searchViewState.get();

  const [users, setUsers] = React.useState([]);
  const [emojis, setEmojis] = React.useState([]);
  const [owner, setOwner] = React.useState(OWNERSHIP_FILTERS.ANYONE);
  const [dateFilter, setDateFilter] = React.useState(DATE_FILTERS.ANYTIME);

  React.useEffect(() => {
    getUsersMemo(token).then((u) => setUsers(u.members));
    getEmojisMemo(token).then((e) => setEmojis(e.emoji));
  }, []);

  const usersById = _.keyBy(users, "id");

  return (
    <PaginatedResults
      searchViewState={searchViewState}
      logo={logo}
      configuration={configuration}
      queryKey={["slack", { input: searchData.input, token, pageSize, userId, owner, dateFilter }]}
      fetcher={fetchMessages}
      renderPages={slackResultsRenderer(usersById, emojis)}
      getFetchMore={({ ok, messages }) => {
        if (!ok || !messages) {
          return null;
        }

        const { page, pages } = messages.paging;
        return pages > page ? page + 1 : null;
      }}
      itemDetailRenderer={(item) => (
        <SlackDetail token={token} item={item} users={usersById} emojis={emojis} />
      )}
      getTotal={(pages) => _.get(pages, [0, "messages", "total"], null)}
      filters={
        <div style={{ flexGrow: 1 }}>
          <Filter
            value={owner}
            defaultId={OWNERSHIP_FILTERS.ANYONE}
            descriptions={OWNERSHIP_FILTERS_DESCRIPTION}
            label="From"
            setter={setOwner}
          />
          <DateFilter value={dateFilter} setter={setDateFilter} />
        </div>
      }
    />
  );
}
