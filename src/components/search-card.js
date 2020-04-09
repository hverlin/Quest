import React from "react";
import { H5 } from "@blueprintjs/core";
import styles from "./search-results.module.css";

export function SearchCard({ configuration, children, results }) {
  const { name } = configuration.get();
  return (
    <div>
      <div className={styles.results}>
        <div style={{ display: 'flex' }}>
          <H5 style={{ flexGrow: '1'}}>{name}</H5>
          {results && <p>{results}</p>}
        </div>
        {children}
      </div>
    </div>
  );
}
