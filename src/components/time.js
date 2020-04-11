import { DateTime } from "luxon";
import React from "react";
import { Tooltip } from "@blueprintjs/core";

export function Time({ time }) {
  const date = DateTime.fromISO(time);
  return (
    <Tooltip content={date.toLocaleString(DateTime.DATETIME_FULL)}>
      <time>{date.toLocaleString()}</time>
    </Tooltip>
  );
}
