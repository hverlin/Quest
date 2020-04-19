import React from "react";
import { Tooltip } from "@blueprintjs/core";
import styles from "./settings-bar.module.css";
import ButtonLink from "./button-link";

export function SettingsBar() {
  return (
    <div className={styles.settingsBar}>
      <Tooltip content="Settings">
        <ButtonLink small to="/settings" minimal icon="settings">
          Settings
        </ButtonLink>
      </Tooltip>
    </div>
  );
}
