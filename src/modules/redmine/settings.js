import React from "react";
import ConfigurationForm from "../../components/configuration-form";

// noinspection JSUnusedGlobalSymbols
export default function JiraSettings({ configurationState }) {
  return (
    <ConfigurationForm configuration={configurationState} fields={["url", "apiKey", "pageSize"]} />
  );
}
