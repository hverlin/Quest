import React from "react";
import { Button, FormGroup, InputGroup } from "@blueprintjs/core";
import { notify } from "../../services/notification-service";
import { useStateLink } from "@hookstate/core";
import _ from "lodash";

export default function SlackSettings({ configurationState }) {
  const configuration = useStateLink(configurationState);
  const localState = useStateLink(_.cloneDeep(configuration.get()));

  const { token } = localState.get();

  async function save(event) {
    event.preventDefault();
    configuration.nested.token.set(token);
    notify("Slack settings saved successfully.");
  }

  return (
    <>
      <form onSubmit={save}>
        <FormGroup
          label="API Token"
          labelFor="slack-token"
          labelInfo="(required)"
        >
          <InputGroup
            id="slack-token"
            placeholder="API token"
            type="password"
            value={token || ""}
            onChange={(e) => localState.nested.token.set(e.target.value)}
          />
        </FormGroup>
        <Button onClick={save} icon="floppy-disk">
          Save
        </Button>
      </form>
    </>
  );
}
