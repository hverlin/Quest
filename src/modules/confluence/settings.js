import React from "react";
import ConfigurationForm from "../../components/configuration-form";

// noinspection JSUnusedGlobalSymbols
export default function ConfluenceSettings({ configurationState }) {
  return (
    <ConfigurationForm
      configuration={configurationState}
      fields={["url", "username", "password", "filter", "pageSize"]}
    />
  );
}
