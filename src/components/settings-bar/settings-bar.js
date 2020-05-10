import _ from "lodash";
import React from "react";
import {
  Button,
  NonIdealState,
  Popover,
  Radio,
  RadioGroup,
  Switch,
  Tooltip,
} from "@blueprintjs/core";
import styles from "./settings-bar.module.css";
import ButtonLink from "../button-link";
import { useStateLink } from "@hookstate/core";
import { useShortcut } from "../../services/shortcut-manager";
import { Link, withRouter } from "react-router-dom";
import { ThemeManager } from "../../services/theme-service";
import { LAYOUTS, LayoutManager } from "../../services/layout-service";

function LeftSettings({ configuration }) {
  const state = useStateLink(configuration);

  const { highlightResults, theme, layout } = state.nested;

  function toggleHighlighting() {
    highlightResults.set(!highlightResults.get());
    if (highlightResults.get()) {
      document.body.classList.remove("no-highlight");
    } else {
      document.body.classList.add("no-highlight");
    }
  }

  useShortcut("toggleHighlighting", toggleHighlighting);
  useShortcut("changeLayout", () =>
    LayoutManager.setLayout(layout.get() === LAYOUTS.COLUMNS ? LAYOUTS.ROWS : LAYOUTS.COLUMNS)
  );

  return (
    <div style={{ flexGrow: 1 }}>
      <Tooltip content={highlightResults.get() ? "Disable highlighting" : "Highlight results"}>
        <Button
          icon="highlight"
          intent={highlightResults.get() ? "primary" : ""}
          small
          minimal
          style={{ margin: 3, opacity: highlightResults.get() ? 1 : 0.4 }}
          onClick={toggleHighlighting}
        />
      </Tooltip>
      <Tooltip
        content={
          ThemeManager.shouldUseDarkTheme()
            ? `Use light theme (current: ${theme.get()})`
            : `Use dark theme (current: ${theme.get()})`
        }
      >
        <Button
          icon={ThemeManager.shouldUseDarkTheme() ? "flash" : "moon"}
          small
          minimal
          style={{ margin: 3 }}
          onClick={() => ThemeManager.toggleTheme()}
        />
      </Tooltip>
      <Popover
        hasBackdrop
        target={
          <Tooltip content="Change layout">
            <Button icon="list-detail-view" small minimal style={{ margin: 3 }} />
          </Tooltip>
        }
        content={
          <div className={styles.popoverContainer}>
            <RadioGroup
              onChange={(e) => LayoutManager.setLayout(e.currentTarget.value)}
              selectedValue={layout.get()}
            >
              {Object.values(LAYOUTS).map((availableLayout) => (
                <Radio key={availableLayout} label={availableLayout} value={availableLayout} />
              ))}
            </RadioGroup>
          </div>
        }
      />
    </div>
  );
}

function ModuleList({ configuration }) {
  const modules = useStateLink(configuration);

  return (
    <div className={styles.popoverContainer}>
      {_.isEmpty(modules.nested) && (
        <NonIdealState
          description="No search modules configured"
          action={<Link to="/settings">Settings</Link>}
        />
      )}
      {modules.nested.map((module) => {
        return (
          <div key={module.nested.id.get()}>
            <Switch
              label={module.nested.name.get()}
              onChange={() => module.nested.enabled.set(!module.nested.enabled.get())}
              checked={module.nested.enabled.get()}
              alignIndicator="left"
            />
          </div>
        );
      })}
    </div>
  );
}

function SettingsBar({ configuration, history }) {
  const state = useStateLink(configuration);
  const buttonRef = React.useRef();

  useShortcut("openSettings", () => history.push("/settings"));
  useShortcut("quickModuleList", () => buttonRef.current.buttonRef.click());

  return (
    <div className={styles.settingsBar}>
      <LeftSettings configuration={state.nested.appearance} />
      <Popover
        hasBackdrop
        target={
          <Tooltip content="Enable/disable modules">
            <Button ref={buttonRef} small minimal icon="segmented-control">
              Modules
            </Button>
          </Tooltip>
        }
        content={<ModuleList configuration={state.nested.modules} />}
      />
      <Tooltip content="Settings">
        <ButtonLink small to="/settings" minimal icon="settings">
          Settings
        </ButtonLink>
      </Tooltip>
    </div>
  );
}

export default withRouter(SettingsBar);
