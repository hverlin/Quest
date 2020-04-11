const _ = require("lodash");
import React from "react";
import { Card, Drawer, H5 } from "@blueprintjs/core";
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
  configuration,
  total,
  items,
  itemRenderer,
  error,
}) {
  const [selectedItem, setSelectedItem] = React.useState(null);
  const { name } = configuration.get();

  return (
    <div>
      <Drawer
        position="bottom"
        size={Drawer.SIZE_SMALL}
        isOpen={!!selectedItem}
        onClose={() => setSelectedItem(null)}
      >
        <Card>{selectedItem && itemRenderer(selectedItem)}</Card>
      </Drawer>
      <div className={styles.results}>
        <div style={{ display: "flex" }}>
          <H5 style={{ flexGrow: "1" }}>{name}</H5>
          {!error && total > 0 && <p>{total} results</p>}
        </div>
        {error
          ? "Error when loading results"
          : renderItems(itemRenderer, items, (item) => setSelectedItem(item))}
      </div>
    </div>
  );
}
