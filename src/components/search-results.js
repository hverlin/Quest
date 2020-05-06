import _ from "lodash";
import React from "react";
import { Button, Callout, Card, H5 } from "@blueprintjs/core";
import styles from "./search-results.module.css";
import { useSWRPages } from "swr";
import { SKELETON } from "@blueprintjs/core/lib/cjs/common/classes";
import { useStateLink } from "@hookstate/core";
import FocusableCard from "./card";
import Highlighter from "./highlighter";
import { v4 as uuidv4 } from "uuid";

const numberFormatter = new Intl.NumberFormat();

export function PaginatedSearchResults({
  searchViewState,
  logo,
  itemDetailRenderer,
  configuration,
  error,
  pageFunc,
  computeNextOffset,
  deps = [],
  getTotal = _.noop,
  filters,
}) {
  const state = useStateLink(searchViewState);
  const { name } = configuration.get();

  const { pages, pageSWRs, isLoadingMore, isReachingEnd, isEmpty, loadMore } = useSWRPages(
    `${name}-${state.nested.input.get()}`,
    pageFunc(({ component, item, error, key }) => {
      if (error) {
        return <Callout intent="danger">An error occurred while loading the results</Callout>;
      }

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
            <div>
              <p className={SKELETON}>Loading...</p>
              <p className={SKELETON} style={{ height: "3rem" }}>
                Loading...
              </p>
            </div>
          )}
        </FocusableCard>
      );
    }),
    computeNextOffset,
    deps
  );

  const total = getTotal(pageSWRs);

  return (
    <div className={styles.results}>
      <div style={{ display: "flex", alignItems: "center" }}>
        {logo && (
          <img style={{ height: "1rem", marginRight: "0.4rem" }} src={logo} alt={`${name} logo`} />
        )}
        <H5 style={{ marginBottom: 0 }}>{name}</H5>
        {!error && !isLoadingMore && total > 0 && (
          <p style={{ marginBottom: 0, marginLeft: 5 }}>
            ({numberFormatter.format(total)} {total === 1 ? "result" : "results"})
          </p>
        )}
        <div style={{ flexGrow: 1 }} />
        <div style={{ display: "flex", marginLeft: 15 }}>{filters}</div>
      </div>

      <div className={styles.resultList}>
        {error ? (
          <Callout intent="danger" className={styles.resultItem}>
            {error}
          </Callout>
        ) : isEmpty ? (
          <Card className={styles.resultItem}>No results.</Card>
        ) : (
          pages
        )}
      </div>

      {isReachingEnd || isLoadingMore || error ? null : (
        <div>
          <Button
            className="focusable"
            minimal
            intent="primary"
            rightIcon="arrow-right"
            onClick={loadMore}
          >
            Load More
          </Button>
        </div>
      )}
    </div>
  );
}
