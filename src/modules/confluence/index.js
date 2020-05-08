import React from "react";
import { ExternalLink } from "../../components/external-link";
import _ from "lodash";
import logo from "./logo.svg";
import { H2, Spinner, Classes, Tag } from "@blueprintjs/core";
import SafeHtmlElement from "../../components/safe-html-element";
import cheerio from "cheerio";
import qs from "qs";
import { PaginatedResults } from "../../components/paginated-results/paginated-results";
import { useQuery } from "react-query";

const appSession = require("electron").remote.session;

function cleanConfluenceHtml(html, baseUrl) {
  function addBaseUrl(el, attribute) {
    const originalUrl = el.attribs[attribute];
    if (originalUrl && !originalUrl.startsWith("http")) {
      el.attribs[attribute] = baseUrl + originalUrl;
    }
  }

  const $ = cheerio.load(html);

  // confluence links are relative, so add the base url
  $("img, script").each((index, el) => addBaseUrl(el, "src"));
  $("a, link").each((index, el) => addBaseUrl(el, "href"));

  // remove any added styles
  $("*").each((index, el) => {
    if (el.attribs["style"]) {
      el.attribs["style"] = "";
    }
  });

  $("p").each((i, el) => {
    if (_.isEmpty($(el).text().trim())) {
      el.attribs["data-marked-for-removal"] = "true";
    }
  });
  $("[data-marked-for-removal='true']").remove();

  $("[data-macro-name='note']").addClass(Classes.CALLOUT);
  $("[data-macro-name='info']").addClass(Classes.CALLOUT);
  $("[data-macro-name='tip']").addClass(Classes.CALLOUT).addClass(Classes.INTENT_SUCCESS);
  $("[data-macro-name='warning']").addClass(Classes.CALLOUT).addClass(Classes.INTENT_WARNING);

  $("[data-macro-name='toc']").remove();

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
  return message && message.replace(/@@@hl@@@(.*?)@@@endhl@@@/gm, `$1`);
}

function ConfluenceDetail({ item, username, password, url, pageSize = 5, filter }) {
  const link = `${_.get(item, "content._links.self")}?expand=body.view`;

  const { data, error } = useQuery(
    link,
    confluenceFetcher({ username, password, baseUrl: url, pageSize, filter })
  );

  if (error) {
    return <p>Failed to load document: {link}</p>;
  }

  if (!data) {
    return <Spinner />;
  }

  return (
    <div className={Classes.RUNNING_TEXT}>
      <H2>{item.content.title}</H2>
      <p>
        <ExternalLink href={url + item.url}>Edit in Confluence</ExternalLink>
      </p>
      <p>
        {item.content?.metadata?.labels.results.map(({ name, id }) => (
          <Tag key={id} round minimal style={{ marginRight: 2, marginLeft: 2 }}>
            {name}
          </Tag>
        ))}
      </p>
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

const makeConfluenceRenderer = (url) => ({ pages }) => {
  return _.flatten(
    pages.map(({ results }) => {
      return results?.map((result) => ({
        key: result.content.id,
        component: <ConfluenceItem key={result.content.id} url={url} item={result} />,
        item: result,
      }));
    })
  );
};

async function confluenceResultsFetcher(
  key,
  { input, filter, pageSize, username, password, baseUrl },
  offset
) {
  const searchParams = qs.stringify({
    cql: `(siteSearch ~ "${input}" and type = "page"${filter ? ` and ${filter}` : ""})`,
    expand: "content.metadata.labels",
    start: offset || 0,
    limit: pageSize,
  });

  const res = await fetch(`${baseUrl}/rest/api/search?${searchParams}`, {
    credentials: "omit",
    headers: {
      Authorization: `Basic ${btoa(`${username}:${password}`)}`,
      Content: "application/json",
      Origin: baseUrl,
    },
  });

  if (res.headers.has("quest-cookie")) {
    const [name, value] = res.headers.get("quest-cookie").split(";")[0].split("=");
    await appSession.defaultSession.cookies.set({ url: baseUrl, name, httpOnly: true, value });
  }

  return res.json();
}

export default function ConfluenceSearchResults({ configuration, searchViewState }) {
  const searchData = searchViewState.get();
  const { username, password, url, pageSize, filter } = configuration.get();

  return (
    <PaginatedResults
      queryKey={[
        "confluence",
        { input: searchData.input, username, password, filter, baseUrl: url, pageSize },
      ]}
      searchViewState={searchViewState}
      logo={logo}
      fetcher={confluenceResultsFetcher}
      globalError={!url ? "Confluence module is not configured correctly. URL is missing." : null}
      configuration={configuration}
      renderPages={makeConfluenceRenderer(url)}
      itemDetailRenderer={(item) => (
        <ConfluenceDetail item={item} username={username} password={password} url={url} />
      )}
      getFetchMore={({ totalSize, start, size }) =>
        totalSize > start + size ? start + pageSize : null
      }
      getTotal={(pages) => _.get(pages, [0, "totalSize"], null)}
    />
  );
}
