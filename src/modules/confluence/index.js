import useSWR from "swr";
import React from "react";
import { PaginatedSearchResults } from "../../components/search-results";
import { ExternalLink } from "../../components/external-link";
import _ from "lodash";
import logo from "./logo.svg";
import { H2, Spinner } from "@blueprintjs/core";
import SafeHtmlElement from "../../components/safe-html-element";
import cheerio from "cheerio";

const appSession = require("electron").remote.session;

const pageSize = 5;

function cleanConfluenceHtml(html, baseUrl) {
  function convert(el, attribute) {
    if (el.attribs[attribute]) {
      el.attribs[attribute] = baseUrl + el.attribs[attribute];
    }
  }

  const $ = cheerio.load(html);

  // confluence links are relative, so add the base url
  $("img, script").each((index, el) => convert(el, "src"));
  $("a, link").each((index, el) => convert(el, "href"));

  // remove the width for tables as they are often too narrow
  $("table").each((index, el) => {
    if (el.attribs["style"]) {
      el.attribs["style"] = "";
    }
  });

  return $.html();
}

const confluenceFetcher = ({ username, password, baseUrl }) => async (url) => {
  const res = await fetch(url, {
    credentials: "omit",
    headers: {
      Authorization: `Basic ${btoa(`${username}:${password}`)}`,
      Accept: "application/json",
    },
  });

  if (res.headers.has("quest-cookie")) {
    const [name, value] = res.headers.get("quest-cookie").split(";")[0].split("=");
    await appSession.defaultSession.cookies.set({
      url: baseUrl,
      name,
      httpOnly: true,
      value,
    });
  }
  return res.json();
};

function parseConfluenceDocument(message) {
  return message && message.replace(/@@@hl@@@(.*?)@@@endhl@@@/gm, `<b>$1</b>`);
}

function ConfluenceDetail({ item, username, password, url }) {
  const link = `${_.get(item, "content._links.self")}?expand=body.view`;

  const { data, error } = useSWR(link, confluenceFetcher({ username, password, baseUrl: url }));

  if (error) {
    return <p>Failed to load document: {link}</p>;
  }

  if (!data) {
    return <Spinner />;
  }

  return (
    <div>
      <H2>{item.content.title}</H2>
      <SafeHtmlElement html={cleanConfluenceHtml(data?.body.view.value, url)} />
    </div>
  );
}

function ConfluenceItem({ item = {}, url }) {
  const { content = {}, excerpt, friendlyLastModified, url: itemUrl } = item;
  return (
    <>
      <p>
        <ExternalLink href={url + itemUrl}>{content.title}</ExternalLink>
      </p>
      <SafeHtmlElement tag="p" html={parseConfluenceDocument(excerpt)} />
      <p>Updated {friendlyLastModified}</p>
    </>
  );
}

function getConfluencePage(url, searchData, username, password) {
  return (wrapper) => ({ offset = 0, withSWR }) => {
    const { data, error } = withSWR(
      useSWR(
        () =>
          url
            ? `${url}/rest/api/search?cql=(siteSearch ~ "${
                searchData.input
              }" and space = "ENG" and type = "page")&start=${offset || 0}&limit=${pageSize}`
            : null,
        confluenceFetcher({ username, password, baseUrl: url })
      )
    );

    if (error) {
      return wrapper({ error, item: null });
    }

    if (!data) {
      return wrapper({ item: null });
    }

    return data?.results.map((result) =>
      wrapper({
        key: result.content.id,
        component: <ConfluenceItem url={url} item={result} />,
        item: result,
      })
    );
  };
}

export default function ConfluenceSearchResults({
  searchData = {},
  configuration,
  searchViewState,
}) {
  const { username, password, url } = configuration.get();

  return (
    <PaginatedSearchResults
      searchViewState={searchViewState}
      searchData={searchData}
      logo={logo}
      error={!url ? "Confluence module is not configured correctly. URL is missing." : null}
      configuration={configuration}
      itemDetailRenderer={(item) => (
        <ConfluenceDetail item={item} username={username} password={password} url={url} />
      )}
      computeNextOffset={({ data }) =>
        data && data.totalSize > data.start + data.size ? data.start + pageSize : null
      }
      pageFunc={getConfluencePage(url, searchData, username, password)}
    />
  );
}
