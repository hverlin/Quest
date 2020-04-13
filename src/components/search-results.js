import _ from "lodash";
import React from "react";
import { Button, Callout, Card, Drawer, H5 } from "@blueprintjs/core";
import styles from "./search-results.module.css";
import { useSWRPages } from "swr";
import { SKELETON } from "@blueprintjs/core/lib/cjs/common/classes";

const numberFormatter = new Intl.NumberFormat();

export function PaginatedSearchResults({
  searchData,
  logo,
  itemDetailRenderer,
  configuration,
  error,
  pageFunc,
  computeNextOffset,
  deps = [],
}) {
  const { name } = configuration.get();
  const [selectedItem, setSelectedItem] = React.useState(null);
  const [drawerSize, setDrawerSize] = React.useState(Drawer.SIZE_STANDARD);

  const { pages, pageSWRs, isLoadingMore, isReachingEnd, isEmpty, loadMore } = useSWRPages(
    `${name}-${searchData.input}`,
    pageFunc(({ component, item, error }) => {
      if (error) {
        return <Callout intent="danger">An error occurred while the loading results</Callout>;
      }

      return (
        <Card
          interactive={!!item}
          onClick={item ? () => setSelectedItem(item) : undefined}
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
        </Card>
      );
    }),
    computeNextOffset,
    deps
  );

  const total = _.get(pageSWRs, [0, "data", "total"], null);

  function getDrawer() {
    return (
      <Drawer
        size={drawerSize}
        isOpen={!!selectedItem}
        onClose={() => {
          setSelectedItem(null);
          setDrawerSize(Drawer.SIZE_STANDARD);
        }}
        style={{ transition: "all 0.3s ease-out" }}
      >
        <div className={styles.drawerContainer}>
          <Button
            icon="expand-all"
            minimal
            onClick={() => {
              setDrawerSize(
                drawerSize === Drawer.SIZE_LARGE ? Drawer.SIZE_STANDARD : Drawer.SIZE_LARGE
              );
            }}
          >
            Expand
          </Button>
          {selectedItem && itemDetailRenderer(selectedItem)}
        </div>
      </Drawer>
    );
  }

  return (
    <div className={styles.results}>
      {getDrawer()}
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
      {!isEmpty && !error && <div className={styles.resultList}>{pages}</div>}
      {isEmpty && !error && <Card className={styles.resultItem}>No results.</Card>}
      {error && (
        <Callout intent="danger" className={styles.resultItem}>
          {error}
        </Callout>
      )}
      {isReachingEnd || isLoadingMore || error ? null : (
        <div>
          <Button minimal intent="primary" rightIcon="arrow-right" onClick={loadMore}>
            Load More
          </Button>
        </div>
      )}
    </div>
  );
}
