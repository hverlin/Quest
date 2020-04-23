import React from "react";
import { FormGroup } from "@blueprintjs/core";
import { useStateLink } from "@hookstate/core";
import PasswordInput from "../../components/password-input";

// noinspection JSUnusedGlobalSymbols
export default function PaperSettings({ configurationState }) {
  const configuration = useStateLink(configurationState);

  const { token } = configuration.get();

  return (
    <form>
      <FormGroup label="API Token" labelFor="dropbox-paper-token" labelInfo="(required)">
        <PasswordInput
          id="dropbox-paper-token"
          placeholder="API token"
          type="password"
          value={token || ""}
          onChange={(e) => configuration.nested.token.set(e.target.value)}
        />
      </FormGroup>
    </form>
  );
}
