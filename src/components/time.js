import { DateTime } from "luxon";
import React from "react";
import { Tooltip } from "@blueprintjs/core";

export function Time({ time }) {
  const date = DateTime.fromISO(time);
  return (
    <Tooltip openOnTargetFocus={false} content={date.toLocaleString(DateTime.DATETIME_FULL)}>
      <time dateTime={time}>{date.toLocaleString()}</time>
    </Tooltip>
  );
}
