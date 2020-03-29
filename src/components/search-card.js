import React from "react";
import { Card, Elevation, H5 } from "@blueprintjs/core";

export function SearchCard({ name, children }) {
  return (
    <Card elevation={Elevation.TWO} style={{ marginBottom: "10px" }}>
      <H5>{name}</H5>
      {children}
    </Card>
  );
}