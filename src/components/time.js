import { DateTime } from "luxon";
import React from "react";

export function Time({time}) {
  const date = DateTime.fromISO(time);
  return <time>{date.toLocaleString()}</time>;
}
