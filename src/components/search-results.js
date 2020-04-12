import _ from "lodash";
import React from "react";
import { Button, Card, Drawer, H5 } from "@blueprintjs/core";
import styles from "./search-results.module.css";

function generateFakeItems() {
  return [1, 2, 3, 4, 5].map((id) => ({ id }));
}

function renderItems(itemRenderer, items, onItemClick) {
  if (items && _.size(items) <= 0) {
    return <Card>No results</Card>;
  }

  return (
    <>
      {items
        ? _.take(items, 5).map((item) => (
            <Card
              interactive
              key={item.id ?? item.key ?? JSON.stringify(item)}
              onClick={() => onItemClick(item)}
            >
              {itemRenderer(item)}
            </Card>
          ))
        : generateFakeItems().map((item) => (
            <Card key={item.id}>{itemRenderer(item, { isLoading: true })}</Card>
          ))}
    </>
  );
}

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
  const [drawerSize, setDrawerSize] = React.useState(Drawer.SIZE_SMALL);
  const { name } = configuration.get();

  return (
    <div>
      <Drawer
        // position="bottom"
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
                drawerSize === Drawer.SIZE_LARGE
                  ? Drawer.SIZE_STANDARD
                  : Drawer.SIZE_LARGE
              );
            }}
          >
            Expand
          </Button>
          {selectedItem &&
            (itemDetailRenderer ? itemDetailRenderer : itemRenderer)(
              selectedItem
            )}
        </div>
      </Drawer>
      <div className={styles.results}>
        <div style={{ display: "flex" }}>
          {logo && (
            <img style={{ height: "1rem", marginRight: "0.4rem" }} src={logo} />
          )}
          <H5 style={{ flexGrow: "1", marginBottom: 0 }}>{name}</H5>
          {!error && total > 0 && (
            <p style={{ marginBottom: 0 }}>{total} results</p>
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
