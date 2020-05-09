import _ from "lodash";
import React from "react";
import { Time } from "../../components/time";
import { ExternalLink } from "../../components/external-link";
import ReactMarkdown from "react-markdown";
import logo from "./logo.svg";
import { Classes, Spinner } from "@blueprintjs/core";
import { PaginatedResults } from "../../components/paginated-results/paginated-results";
import { useQuery } from "react-query";

const paperDetailFetcher = (token) => async (id) => {
  const res = await fetch("https://api.dropboxapi.com/2/paper/docs/download", {
    method: "POST",
    credentials: "omit",
    headers: {
      Authorization: `Bearer ${token}`,
      "Dropbox-API-Arg": JSON.stringify({
        doc_id: id,
        export_format: "markdown",
      }),
    },
  });

  return res.text();
};

async function paperFetcher(key, { token, input, pageSize }, cursor = null) {
  const res = await fetch(
    `https://api.dropboxapi.com/2/files/search${cursor ? "/continue" : ""}_v2`,
    {
      method: "POST",

      credentials: "omit",
      headers: {
        Authorization: `Bearer ${token}`,
        Accept: "application/json",
        "Content-type": "application/json",
      },
      body: JSON.stringify(
        cursor
          ? { cursor }
          : {
              query: input,
              include_highlights: false,
              options: { max_results: pageSize || 5 },
            }
      ),
    }
  );

  return res.json();
}

function PaperResultItem({
  item: { metadata: { metadata: { id, name, server_modified } = {} } = {} } = {},
}) {
  return (
    <>
      <p>
        <ExternalLink href={`https://paper.dropbox.com/${id}`}>{name}</ExternalLink>
      </p>
      <p>
        Last updated <Time iso={server_modified} />
      </p>
    </>
  );
}

function PaperDocDetail({ item, token }) {
  const id = _.get(item, "metadata.metadata.id");

  const { data, error } = useQuery(id, paperDetailFetcher(token));

  if (error) {
    return <p>Failed to load document: {id}</p>;
  }

  if (!data) {
    return <Spinner />;
  }

  return (
    <div className={Classes.RUNNING_TEXT}>
      <ReactMarkdown escapeHtml={false} source={data} />
    </div>
  );
}

const paperRenderer = ({ pages }) => {
  return _.flatten(
    pages.map(({ matches }) => {
      return matches?.map((item) => ({
        key: item.metadata.metadata.id,
        component: <PaperResultItem key={item.metadata.metadata.id} item={item} />,
        item,
      }));
    })
  );
};

export default function PaperSearchResults({ configuration, searchViewState }) {
  const { token, pageSize } = configuration.get();
  const searchData = searchViewState.get();

  return (
    <PaginatedResults
      queryKey={["paper", { input: searchData.input, token, pageSize }]}
      fetcher={paperFetcher}
      renderPages={paperRenderer}
      searchViewState={searchViewState}
      logo={logo}
      configuration={configuration}
      itemDetailRenderer={(item) => <PaperDocDetail item={item} token={token} />}
      getFetchMore={({ cursor }) => cursor ?? null}
    />
  );
}
