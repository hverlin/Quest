import React from "react";
import { Button, Tooltip } from "@blueprintjs/core";
import styles from "./settings-bar.module.css";
import { Redirect } from "react-router-dom";

export function SettingsBar() {
  const [redirect, setRedirect] = React.useState(false);

  if (redirect) {
    return <Redirect to="/settings" />;
  }

  return (
    <div className={styles.settingsBar}>
      <Tooltip content="Settings">
        <Button small onClick={() => setRedirect(true)} minimal icon="settings">
          Settings
        </Button>
      </Tooltip>
    </div>
  );
}
