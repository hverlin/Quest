import React from "react";
import ConfigurationForm from "../../components/configuration-form";

// noinspection JSUnusedGlobalSymbols
export default function NextcloudSettings({ configurationState }) {
  return (
    <ConfigurationForm
      configuration={configurationState}
      fields={["url", "username", "password", "pageSize"]}
    />
  );
}
