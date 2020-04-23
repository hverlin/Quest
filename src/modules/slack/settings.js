import React from "react";
import { FormGroup } from "@blueprintjs/core";
import { useStateLink } from "@hookstate/core";
import PasswordInput from "../../components/password-input";

// noinspection JSUnusedGlobalSymbols
export default function SlackSettings({ configurationState }) {
  const configuration = useStateLink(configurationState);

  const { token } = configuration.get();
  return (
    <form>
      <FormGroup label="API Token" labelFor="slack-token" labelInfo="(required)">
        <PasswordInput
          id="slack-token"
          placeholder="API token"
          type="password"
          value={token || ""}
          onChange={(e) => configuration.nested.token.set(e.target.value)}
        />
      </FormGroup>
    </form>
  );
}
