import _ from "lodash";
import React from "react";
import { Time } from "../../components/time";
import { ExternalLink } from "../../components/external-link";
import logo from "./logo.svg";
import qs from "qs";
import { PaginatedResults } from "../../components/paginated-results/paginated-results";
import { H3 } from "@blueprintjs/core";
import { Size } from "../../components/size";

function NextcloudDetail({ item, url }) {
  const { name, link, modified, type, path, mime_type, size } = item;

  return (
    <div>
      <div>
        <H3>
          <ExternalLink href={url + link}>
            {type} - {name}
          </ExternalLink>
        </H3>
      </div>
      <p>
        Updated: <Time seconds={modified} /> | Path: {path} | Mime-Type: {mime_type} | Size:{" "}
        <Size bytes={size} />
      </p>
    </div>
  );
}

function NextcloudResultItem({ item = {}, url }) {
  const { name, link, modified, type } = item;

  return (
    <>
      <p>
        <ExternalLink href={url + link}>
          {type} - {name}
        </ExternalLink>
      </p>
      <p>
        Updated: <Time seconds={modified} />
      </p>
    </>
  );
}

const makeNextcloudRenderer = (url) => ({ pages }) => {
  return _.flatten(
    pages.map(({ results }) => {
      return results?.map((item) => ({
        key: item.id,
        component: <NextcloudResultItem key={item.id} url={url} item={item} />,
        item: item,
      }));
    })
  );
};

async function nextcloudResultsFetcher(
  key,
  { input, pageSize, username, password, baseUrl },
  page = 1
) {
  const searchParams = qs.stringify({ q: input, page, limit: pageSize, computeHasMore: true });

  const url = `${baseUrl}/index.php/apps/quest/api/0.1/search?${searchParams}`;

  const res = await fetch(url, {
    credentials: "omit",
    headers: {
      Authorization: `Basic ${btoa(`${username}:${password}`)}`,
      Content: "application/json",
      Origin: url,
    },
  });

  const result = await res.json();

  return {
    ...result,
    page,
  };
}

export default function NextcloudSearchResults({ configuration, searchViewState }) {
  const searchData = searchViewState.get();
  const { username, password, url, pageSize } = configuration.get();

  return (
    <PaginatedResults
      queryKey={[
        "nextcloud",
        { input: searchData.input, username, password, baseUrl: url, pageSize },
      ]}
      searchViewState={searchViewState}
      logo={logo}
      globalError={!url ? "Nextcloud module is not configured correctly. URL is missing." : null}
      configuration={configuration}
      getFetchMore={({ has_more, page }) => (has_more ? page + 1 : null)}
      fetcher={nextcloudResultsFetcher}
      itemDetailRenderer={(item) => <NextcloudDetail item={item} url={url} />}
      renderPages={makeNextcloudRenderer(url)}
    />
  );
}
