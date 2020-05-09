import React from "react";
import { Time } from "../../components/time";
import qs from "qs";
import { ExternalLink } from "../../components/external-link";
import logo from "./logo.svg";
import { PaginatedResults } from "../../components/paginated-results/paginated-results";
import _ from "lodash";

async function revisionSearchFetcher(key, { baseUrl, pageSize, token, input }, cursor) {
  const res = await fetch(`${baseUrl}/api/differential.revision.search`, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${token}`,
      Accept: "application/json",
      "Content-type": "application/x-www-form-urlencoded",
    },
    body: qs.stringify({
      "api.token": token,
      constraints: { query: input },
      limit: pageSize,
      after: cursor,
    }),
  });

  return res.json();
}

function RevisionResultItem({ url, item }) {
  const { fields, id } = item;
  return (
    <>
      <p>
        <ExternalLink href={`${url}/D${id}`}>D{id}</ExternalLink> {fields.title}
      </p>
      <p>
        {fields.summary.length > 200 ? fields.summary.substring(0, 200) + "..." : fields.summary}
      </p>
      <p>
        Last updated <Time seconds={fields.dateModified} />
      </p>
    </>
  );
}

const makePhabRenderer = (url) => ({ pages }) => {
  return _.flatten(
    pages.map(({ result }) => {
      return result?.data?.map((item) => ({
        key: item.key,
        component: <RevisionResultItem key={item.id} url={url} item={item} />,
        item,
      }));
    })
  );
};

export default function PaperSearchResults({ configuration, searchViewState }) {
  const { url, token, pageSize } = configuration.get();
  const searchData = searchViewState.get();

  return (
    <PaginatedResults
      queryKey={["phabricator", { input: searchData.input, token, baseUrl: url, pageSize }]}
      renderPages={makePhabRenderer(url)}
      fetcher={revisionSearchFetcher}
      searchViewState={searchViewState}
      logo={logo}
      configuration={configuration}
      getFetchMore={({ result }) => (result?.cursor?.after ? result?.cursor?.after : null)}
    />
  );
}
