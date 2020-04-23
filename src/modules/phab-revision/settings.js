import React from "react";
import { FormGroup, InputGroup } from "@blueprintjs/core";
import { useStateLink } from "@hookstate/core";
import PasswordInput from "../../components/password-input";

export default function PhabricatorSettings({ configurationState }) {
  const configuration = useStateLink(configurationState);
  const { token, url } = configuration.get();

  return (
    <form>
      <FormGroup label="URL" labelFor="phabricator-url" labelInfo="(required)">
        <InputGroup
          id="phabricator-url"
          placeholder="URL (e.g. https://phabricator.company.com)"
          value={url || ""}
          onChange={(e) => configuration.nested.url.set(e.target.value)}
        />
      </FormGroup>
      <FormGroup label="API Token" labelFor="phabricator-token" labelInfo="(required)">
        <PasswordInput
          id="phabricator-password"
          placeholder="API Token"
          type="password"
          value={token || ""}
          onChange={(e) => configuration.nested.token.set(e.target.value)}
        />
      </FormGroup>
    </form>
  );
}
