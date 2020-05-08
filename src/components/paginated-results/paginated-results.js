import _ from "lodash";
import React from "react";
import { Button, Callout, Card, H5 } from "@blueprintjs/core";
import styles from "./paginated-results.module.css";
import { SKELETON } from "@blueprintjs/core/lib/cjs/common/classes";
import { useStateLink } from "@hookstate/core";
import { v4 as uuidv4 } from "uuid";
import { useInfiniteQuery } from "react-query";
import FocusableCard from "../card";
import Highlighter from "../highlighter";

const numberFormatter = new Intl.NumberFormat();

const loader = (
  <FocusableCard>
    <div>
      <p className={SKELETON}>Loading...</p>
      <p className={SKELETON} style={{ height: "3rem" }}>
        Loading...
      </p>
    </div>
  </FocusableCard>
);

function renderResults({ key, component, item, state, itemDetailRenderer }) {
  const focusKey = uuidv4();

  return (
    <FocusableCard
      data-focus-key={focusKey}
      key={key}
      interactive={!!item && itemDetailRenderer}
      onClick={
        item && itemDetailRenderer
          ? () => {
              // Ugly workaround: We cannot pass a reference to a view with hookState so
              // pass it though the global window object instead :/
              window.detailView = itemDetailRenderer;
              item.__focusKey = focusKey;
              state.nested.selectedItem.set(item);
            }
          : undefined
      }
      className={styles.resultItem}
    >
      {component ? <Highlighter text={state.nested.input.get()}>{component}</Highlighter> : null}
    </FocusableCard>
  );
}

export function PaginatedResults({
  searchViewState,
  logo,
  configuration,
  queryKey,
  fetcher,
  getFetchMore,
  renderPages = _.noop,
  getTotal = _.noop,
  filters,
  itemDetailRenderer,
  globalError,
}) {
  const state = useStateLink(searchViewState);

  const {
    status,
    data,
    isFetchingMore,
    fetchMore,
    canFetchMore,
    error,
    isFetching,
  } = useInfiniteQuery(globalError ? null : queryKey, fetcher, { getFetchMore });

  const total = getTotal(data);
  const { name, pageSize } = configuration.get();

  const pages = status === "success" ? renderPages({ pages: data, error }) : [];
  const isEmpty = _.isEmpty(pages);

  return (
    <div className={styles.results}>
      <div style={{ display: "flex", alignItems: "center" }}>
        {logo && (
          <img style={{ height: "1rem", marginRight: "0.4rem" }} src={logo} alt={`${name} logo`} />
        )}
        <H5 style={{ marginBottom: 0 }}>{name}</H5>
        {!error && total > 0 && (
          <p style={{ marginBottom: 0, marginLeft: 5 }}>
            ({numberFormatter.format(total)} {total === 1 ? "result" : "results"})
          </p>
        )}
        <div style={{ flexGrow: 1 }} />
        <div style={{ display: "flex", marginLeft: 15 }}>{filters}</div>
      </div>

      <div className={styles.resultList}>
        {globalError ? (
          <Callout intent="danger" className={styles.resultItem}>
            {globalError}
          </Callout>
        ) : status === "loading" ? null : status === "error" ? (
          <Callout intent="danger" className={styles.resultItem}>
            {error.message}
          </Callout>
        ) : _.isEmpty(pages) ? (
          <Card className={styles.resultItem}>No results.</Card>
        ) : (
          pages.map(({ key, component, item }) =>
            renderResults({ key, component, item, state, itemDetailRenderer })
          )
        )}
        {(!globalError && isFetching && isEmpty) || isFetchingMore
          ? Array(isFetching ? pageSize : 1)
              .fill(0)
              .map((id, index) => <React.Fragment key={index}>{loader}</React.Fragment>)
          : null}
      </div>

      {canFetchMore && !isFetchingMore && (
        <div>
          <Button
            className="focusable"
            minimal
            intent="primary"
            rightIcon="arrow-right"
            onClick={() => fetchMore()}
          >
            Load More
          </Button>
        </div>
      )}
    </div>
  );
}
