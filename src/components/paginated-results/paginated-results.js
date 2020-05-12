import _ from "lodash";
import React, { useState } from "react";
import { Button, Callout, Card, H5, Popover, Tooltip } from "@blueprintjs/core";
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

function renderResults({ key, component, item, state, itemDetailRenderer } = {}) {
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
      {component ? (
        <Highlighter text={state.nested.input.get()}>{component}</Highlighter>
      ) : (
        "Unable to render results."
      )}
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
  const [listRef, setListRef] = useState(null);

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
      <div className={styles.resultsHeader}>
        {logo && <img className={styles.moduleLogo} src={logo} alt={`${name} logo`} />}
        {!error && total > 0 ? (
          <>
            <Tooltip
              content={numberFormatter.format(total) + " " + (total === 1 ? "result" : "results")}
            >
              <H5 className={styles.moduleTitle}>{name}</H5>
            </Tooltip>
            <p className={styles.resultTotal}>
              ({numberFormatter.format(total)} {total === 1 ? "result" : "results"})
            </p>
          </>
        ) : (
          <H5 className={styles.moduleTitle}>{name}</H5>
        )}
        {filters && (
          <>
            <div className={styles.moduleFilters}>{filters}</div>
            <Popover
              className={styles.moduleFiltersMore}
              hasBackdrop
              position={"left"}
              target={
                <Tooltip content="Filters">
                  <Button icon="more" small minimal style={{ margin: 3 }} />
                </Tooltip>
              }
              content={<div className={styles.moduleFiltersMoreContainer}>{filters}</div>}
            />
          </>
        )}
      </div>

      <div className={styles.resultList} ref={setListRef}>
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
          pages.map(({ key, component, item } = {}) =>
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
            onClick={() => {
              const nodes = listRef.querySelectorAll(".focusable");
              nodes[nodes.length - 1].focus();
              fetchMore();
            }}
          >
            Load More
          </Button>
        </div>
      )}
    </div>
  );
}
