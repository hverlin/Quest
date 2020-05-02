import React from "react";
import ConfigurationForm from "../../components/configuration-form";

// noinspection JSUnusedGlobalSymbols
export default function RedmineSettings({ configurationState }) {
  return (
    <ConfigurationForm configuration={configurationState} fields={["url", "apiKey", "pageSize"]} />
  );
}
