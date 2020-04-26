import React from "react";
import { FormGroup, InputGroup, NumericInput } from "@blueprintjs/core";
import { useStateLink } from "@hookstate/core";
import PasswordInput from "../../components/password-input";

// noinspection JSUnusedGlobalSymbols
export default function ConfluenceSettings({ configurationState }) {
  const configuration = useStateLink(configurationState);

  const { username, password, url, filter, pageSize } = configuration.get();

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
      <FormGroup label="Filter" labelFor="confluence-filter">
        <InputGroup
          id="confluence-filer"
          placeholder="Filter"
          value={filter || ""}
          onChange={(e) => configuration.nested.filter.set(e.target.value)}
        />
      </FormGroup>
      <FormGroup
        label="Number of results per page"
        labelFor="confluence-page-size"
        labelInfo="(required)"
      >
        <NumericInput
          id="confluence-filer"
          placeholder="(5 by default)"
          value={pageSize || 5}
          min={1}
          max={50}
          step={1}
          clampValueOnBlur
          minorStepSize={null}
          onValueChange={(num) => configuration.nested.pageSize.set(num ? Math.round(num) : 5)}
        />
      </FormGroup>
    </form>
  );
}
