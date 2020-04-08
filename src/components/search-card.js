import React from "react";
import { Card, Elevation, H5 } from "@blueprintjs/core";

export function SearchCard({ name, children }) {
  return (
    <div>
      <H5>{name}</H5>
      {children}
    </div>
  );
}
