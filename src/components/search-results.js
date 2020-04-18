import _ from "lodash";
import React from "react";
import { Button, Callout, Card, H5 } from "@blueprintjs/core";
import styles from "./search-results.module.css";
import { useSWRPages } from "swr";
import { SKELETON } from "@blueprintjs/core/lib/cjs/common/classes";
import { useStateLink } from "@hookstate/core";
import FocusableCard from "./card";

const numberFormatter = new Intl.NumberFormat();

export function PaginatedSearchResults({
  searchViewState,
  searchData,
  logo,
  itemDetailRenderer,
  configuration,
  error,
  pageFunc,
  computeNextOffset,
  deps = [],
}) {
  const state = useStateLink(searchViewState);
  const { name } = configuration.get();

  const { pages, pageSWRs, isLoadingMore, isReachingEnd, isEmpty, loadMore } = useSWRPages(
    `${name}-${searchData.input}`,
    pageFunc(({ component, item, error, key }) => {
      if (error) {
        return <Callout intent="danger">An error occurred while the loading results</Callout>;
      }

      return (
        <FocusableCard
          key={key}
          interactive={!!item && itemDetailRenderer}
          onClick={
            item && itemDetailRenderer
              ? () => {
                  // Ugly workaround: We cannot pass a reference to a view with hookState so
                  // pass it though the global window object instead :/
                  window.detailView = itemDetailRenderer;
                  state.nested.selectedItem.set(item);
                }
              : undefined
          }
          className={styles.resultItem}
        >
          {component ? (
            component
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

  // TODO: support a total component
  const total = _.get(pageSWRs, [0, "data", "total"], null);

  return (
    <div className={styles.results}>
      <div style={{ display: "flex" }}>
        {logo && (
          <img style={{ height: "1rem", marginRight: "0.4rem" }} src={logo} alt={`${name} logo`} />
        )}
        <H5 style={{ marginBottom: 0 }}>{name}</H5>
        {!error && !isLoadingMore && total > 0 && (
          <p style={{ marginBottom: 0, marginLeft: 5 }}>
            ({numberFormatter.format(total)} {total === 1 ? "result" : "results"})
          </p>
        )}
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
