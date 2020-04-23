import React from "react";
import { FormGroup, InputGroup } from "@blueprintjs/core";
import { useStateLink } from "@hookstate/core";
import PasswordInput from "../../components/password-input";

// noinspection JSUnusedGlobalSymbols
export default function JiraSettings({ configurationState }) {
  const configuration = useStateLink(configurationState);
  const { username, password, url } = configuration.get();

  return (
    <form>
      <FormGroup label="URL" labelFor="jira-url" labelInfo="(required)">
        <InputGroup
          id="jira-url"
          placeholder="URL (e.g. https://jira.domain.com)"
          value={url || ""}
          onChange={(e) => configuration.nested.url.set(e.target.value)}
        />
      </FormGroup>
      <FormGroup label="Username" labelFor="jira-username" labelInfo="(required)">
        <InputGroup
          id="jira-username"
          placeholder="username"
          value={username || ""}
          onChange={(e) => configuration.nested.username.set(e.target.value)}
        />
      </FormGroup>
      <FormGroup label="Password" labelFor="jira-password" labelInfo="(required)">
        <PasswordInput
          id="jira-password"
          placeholder="password"
          value={password || ""}
          onChange={(e) => configuration.nested.password.set(e.target.value)}
        />
      </FormGroup>
    </form>
  );
}
