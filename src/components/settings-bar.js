import React from "react";
import { Button, Tooltip } from "@blueprintjs/core";
import styles from "./settings-bar.module.css";
import ButtonLink from "./button-link";
import { useStateLink } from "@hookstate/core";
import { remote } from "electron";

export function SettingsBar({ configuration }) {
  const state = useStateLink(configuration);

  const { highlightResults, theme } = state.nested;
  const hasDarkTheme = remote.nativeTheme.shouldUseDarkColors && theme.get() !== "light";

  return (
    <div className={styles.settingsBar}>
      <div style={{ flexGrow: 1 }}>
        <Tooltip content={highlightResults.get() ? "Disable highlighting" : "Highlight results"}>
          <Button
            icon="highlight"
            intent={highlightResults.get() ? "primary" : ""}
            small
            minimal
            style={{ margin: 3, opacity: highlightResults.get() ? 1 : 0.4 }}
            onClick={() => {
              highlightResults.set(!highlightResults.get());
              if (highlightResults.get()) {
                document.body.classList.remove("no-highlight");
              } else {
                document.body.classList.add("no-highlight");
              }
            }}
          />
        </Tooltip>
        <Tooltip content={hasDarkTheme ? "Use light theme" : "Use dark theme"}>
          <Button
            icon={hasDarkTheme ? "flash" : "moon"}
            small
            minimal
            style={{ margin: 3 }}
            onClick={() => {
              if (hasDarkTheme) {
                document.body.classList.remove("bp3-dark");
              } else {
                document.body.classList.add("bp3-dark");
              }
              theme.set(hasDarkTheme ? "light" : "dark");
            }}
          />
        </Tooltip>
      </div>
      <Tooltip content="Settings">
        <ButtonLink small to="/settings" minimal icon="settings">
          Settings
        </ButtonLink>
      </Tooltip>
    </div>
  );
}
