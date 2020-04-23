import React from "react";
import { FormGroup, InputGroup } from "@blueprintjs/core";
import { useStateLink } from "@hookstate/core";
import PasswordInput from "../../components/password-input";

// noinspection JSUnusedGlobalSymbols
export default function ConfluenceSettings({ configurationState }) {
  const configuration = useStateLink(configurationState);

  const { username, password, url } = configuration.get();

  return (
    <form>
      <FormGroup label="URL" labelFor="confluence-url" labelInfo="(required)">
        <InputGroup
          id="confluence-url"
          placeholder="URL (e.g. https://confluence.domain.com)"
          value={url || ""}
          onChange={(e) => configuration.nested.url.set(e.target.value)}
        />
      </FormGroup>
      <FormGroup label="Username" labelFor="confluence-username" labelInfo="(required)">
        <InputGroup
          id="confluence-username"
          placeholder="username"
          value={username || ""}
          onChange={(e) => configuration.nested.username.set(e.target.value)}
        />
      </FormGroup>
      <FormGroup label="Password" labelFor="confluence-password" labelInfo="(required)">
        <PasswordInput
          id="confluence-password"
          placeholder="password"
          value={password || ""}
          onChange={(e) => configuration.nested.password.set(e.target.value)}
        />
      </FormGroup>
    </form>
  );
}
