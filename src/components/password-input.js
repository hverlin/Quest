import React from "react";

import { Button, InputGroup, Tooltip } from "@blueprintjs/core";
import { useStateLink } from "@hookstate/core";
import { Intent } from "@blueprintjs/core/lib/esnext/common/intent";

export default function PasswordInput(props) {
  const showPassword = useStateLink(false);

  const lockButton = (
    <Tooltip content={`${showPassword.get() ? "Hide" : "Show"} Password`} disabled={props.disabled}>
      <Button
        aria-label={`${showPassword.get() ? "Hide" : "Show"} Password`}
        disabled={props.disabled}
        icon={showPassword.get() ? "unlock" : "lock"}
        intent={Intent.WARNING}
        minimal={true}
        onClick={() => showPassword.set(!showPassword.get())}
      />
    </Tooltip>
  );

  return (
    <InputGroup
      rightElement={lockButton}
      {...props}
      type={showPassword.get() ? "text" : "password"}
    />
  );
}
