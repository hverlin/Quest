import React from "react";
import { FormGroup } from "@blueprintjs/core";
import { useStateLink } from "@hookstate/core";
import _ from "lodash";
import ConfigurationForm from "../../components/configuration-form";
import { OauthButton } from "../../shared/google-auth";

// noinspection JSUnusedGlobalSymbols
export default function GmailSettings({ configurationState }) {
  const configuration = useStateLink(configurationState);

  return (
    <form>
      <ConfigurationForm
        configuration={configurationState}
        fields={["clientId", "pageSize"]}
        isForm={false}
      />
      <FormGroup>
        <OauthButton
          disabled={_.isEmpty(configuration.nested.clientId.get())}
          configurationState={configurationState}
          scope="https://www.googleapis.com/auth/gmail.readonly"
        />
      </FormGroup>
    </form>
  );
}
