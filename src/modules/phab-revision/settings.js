import React from "react";
import ConfigurationForm from "../../components/configuration-form";

export default function PhabricatorSettings({ configurationState }) {
  return (
    <ConfigurationForm configuration={configurationState} fields={["url", "token", "pageSize"]} />
  );
}
