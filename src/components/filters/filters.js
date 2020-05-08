import { Button, MenuItem } from "@blueprintjs/core";
import { Select } from "@blueprintjs/select";
import React from "react";
import { DateTime } from "luxon";

const itemPredicate = (query, option) =>
  option.value.toLowerCase().indexOf(query.toLowerCase()) >= 0;

function itemRenderer(option, { handleClick, modifiers: { matchesPredicate, active } = {} }) {
  if (!matchesPredicate) {
    return null;
  }

  return <MenuItem key={option.id} active={active} onClick={handleClick} text={option.value} />;
}

export function Filter({ descriptions, value, setter, label, defaultId }) {
  const items = Object.entries(descriptions).map(([id, { value }]) => ({ id, value }));

  return (
    <Select
      filterable={false}
      items={items}
      itemRenderer={itemRenderer}
      onItemSelect={(option) => setter(option.id)}
      itemPredicate={itemPredicate}
    >
      <Button minimal>
        {defaultId === value ? label : `${label}: ${descriptions[value].value}`}
      </Button>
    </Select>
  );
}

const DATE_FILTERS = {
  ANYTIME: "anytime",
  TODAY: "today",
  YESTERDAY: "yesterday",
  LAST_7_DAYS: "last_7_days",
  LAST_30_DAYS: "last_30_days",
  LAST_90_DAYS: "last_90_days",
};

function computeDate(days) {
  return () => DateTime.local().minus({ days }).toISODate();
}

const DATE_FILTERS_DESCRIPTION = {
  [DATE_FILTERS.ANYTIME]: {
    value: "Anytime",
  },
  [DATE_FILTERS.TODAY]: {
    value: "Today",
    date: computeDate(1),
  },
  [DATE_FILTERS.YESTERDAY]: {
    value: "Yesterday",
    date: computeDate(2),
  },
  [DATE_FILTERS.LAST_7_DAYS]: {
    value: "Last 7 days",
    date: computeDate(7),
  },
  [DATE_FILTERS.LAST_30_DAYS]: {
    value: "Last 30 days",
    date: computeDate(30),
  },
  [DATE_FILTERS.LAST_90_DAYS]: {
    value: "Last 90 days",
    date: computeDate(90),
  },
};

export function DateFilter({ value, setter, label = "Date", defaultId = DATE_FILTERS.ANYTIME }) {
  const items = Object.entries(DATE_FILTERS_DESCRIPTION).map(([id, { value }]) => ({ id, value }));

  return (
    <Select
      filterable={false}
      items={items}
      itemRenderer={itemRenderer}
      onItemSelect={(option) => setter(option.id)}
      itemPredicate={itemPredicate}
    >
      <Button minimal>
        {defaultId === value ? label : `${label}: ${DATE_FILTERS_DESCRIPTION[value].value}`}
      </Button>
    </Select>
  );
}

const OWNERSHIP_FILTERS = {
  ANYONE: "anyone",
  ME: "me",
  OTHERS: "others",
};

const OWNERSHIP_FILTERS_DESCRIPTION = {
  [OWNERSHIP_FILTERS.ANYONE]: { value: "Anyone" },
  [OWNERSHIP_FILTERS.ME]: { value: "me" },
  [OWNERSHIP_FILTERS.OTHERS]: { value: "Others" },
};

export function OwnerFilter({
  value,
  setter,
  label = "Owner",
  defaultId = OWNERSHIP_FILTERS.ANYONE,
}) {
  const items = Object.entries(OWNERSHIP_FILTERS_DESCRIPTION).map(([id, { value }]) => ({
    id,
    value,
  }));

  return (
    <Select
      filterable={false}
      items={items}
      itemRenderer={itemRenderer}
      onItemSelect={(option) => setter(option.id)}
      itemPredicate={itemPredicate}
    >
      <Button minimal>
        {defaultId === value ? label : `${label}: ${OWNERSHIP_FILTERS_DESCRIPTION[value].value}`}
      </Button>
    </Select>
  );
}

export { DATE_FILTERS, DATE_FILTERS_DESCRIPTION, OWNERSHIP_FILTERS, OWNERSHIP_FILTERS_DESCRIPTION };
