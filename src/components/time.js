import { DateTime } from "luxon";
import React from "react";
import { Tooltip } from "@blueprintjs/core";

export function Time({ iso, seconds }) {
  const date = iso ? DateTime.fromISO(iso) : DateTime.fromSeconds(+seconds);
  return (
    <Tooltip openOnTargetFocus={false} content={date.toLocaleString(DateTime.DATETIME_FULL)}>
      <time dateTime={iso}>{date.toLocaleString()}</time>
    </Tooltip>
  );
}
