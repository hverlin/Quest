import React from "react";
import ConfigurationForm from "../../components/configuration-form";

// noinspection JSUnusedGlobalSymbols
export default function PaperSettings({ configurationState }) {
  return <ConfigurationForm configuration={configurationState} fields={["token", "pageSize"]} />;
}
