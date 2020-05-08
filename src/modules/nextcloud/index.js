import _ from "lodash";
import React from "react";
import { Time } from "../../components/time";
import { ExternalLink } from "../../components/external-link";
import logo from "./logo.svg";
import qs from "qs";
import { PaginatedResults } from "../../components/paginated-results/paginated-results";

function NextcloudResultItem({ item = {}, url }) {
  const { name, link, modified, type } = item;

  return (
    <>
      <p>
        <ExternalLink href={url + link.replace(/\\/g, "")}>
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
    pages.map(({ result }) => {
      return result?.map((item) => ({
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
  offset
) {
  const searchParams = qs.stringify({ q: input, page: offset || 1, limit: pageSize });

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
    result,
    total: result.length,
    offset: offset || 1,
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
      getFetchMore={({ total, offset }) => (total >= pageSize ? offset + 1 : null)}
      fetcher={nextcloudResultsFetcher}
      itemDetailRenderer={() => {
        //TODO complete this part
        return null;
      }}
      renderPages={makeNextcloudRenderer(url)}
    />
  );
}
