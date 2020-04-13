import _ from "lodash";
import React from "react";
import { Button, Callout, Card, Drawer, H5 } from "@blueprintjs/core";
import styles from "./search-results.module.css";
import { useSWRPages } from "swr";
import { SKELETON } from "@blueprintjs/core/lib/cjs/common/classes";

function generateFakeItems() {
  return [1, 2, 3, 4, 5].map((id) => ({ id }));
}

const numberFormatter = new Intl.NumberFormat();

function renderItems(itemRenderer, items, onItemClick) {
  if (items && _.size(items) <= 0) {
    return (
      <div className={styles.resultList}>
        <Card className={styles.resultItem}>No results</Card>
      </div>
    );
  }

  return (
    <div className={styles.resultList}>
      {items
        ? items.map((item) => (
            <Card
              className={styles.resultItem}
              interactive
              key={item.id ?? item.key ?? JSON.stringify(item)}
              onClick={(e) => {
                // ignore clicks on links
                if ("target" in e.target) {
                  return;
                }
                onItemClick(item);
              }}
            >
              {itemRenderer(item)}
            </Card>
          ))
        : generateFakeItems().map((item) => (
            <Card key={item.id}>{itemRenderer(item, { isLoading: true })}</Card>
          ))}
      <div>
        <Button icon="plus">Load more</Button>
      </div>
    </div>
  );
}

export function PaginatedSearchResults({
  searchData,
  logo,
  itemDetailRenderer,
  configuration,
  error,
  pageFunc,
  computeNextOffset,
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
          {item ? component : <p className={SKELETON}>Loading...</p>}
        </Card>
      );
    }),
    computeNextOffset
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

// TODO: remove once all module are migrated to PaginatedSearchResults
export function SearchResults({
  logo,
  configuration,
  total,
  items,
  itemRenderer,
  itemDetailRenderer,
  error,
}) {
  const [selectedItem, setSelectedItem] = React.useState(null);
  const [drawerSize, setDrawerSize] = React.useState(Drawer.SIZE_STANDARD);
  const { name } = configuration.get();

  return (
    <div>
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
          {selectedItem && (itemDetailRenderer ? itemDetailRenderer : itemRenderer)(selectedItem)}
        </div>
      </Drawer>
      <div className={styles.results}>
        <div style={{ display: "flex" }}>
          {logo && <img style={{ height: "1rem", marginRight: "0.4rem" }} src={logo} />}
          <H5 style={{ marginBottom: 0 }}>{name}</H5>
          {!error && total > 0 && (
            <p style={{ marginBottom: 0, marginLeft: 5 }}>
              ({numberFormatter.format(total)} {total === 1 ? "result" : "results"})
            </p>
          )}
        </div>
        {error ? (
          <Card>Error when loading results</Card>
        ) : (
          renderItems(itemRenderer, items, (item) => setSelectedItem(item))
        )}
      </div>
    </div>
  );
}
