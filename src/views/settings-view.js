import React, { Suspense } from "react";
import {
  Button,
  Card,
  Elevation,
  FormGroup,
  H1,
  H4,
  H5,
  HTMLSelect,
  Switch,
} from "@blueprintjs/core";
import styles from "./settings-view.module.css";

import { useStateLink } from "@hookstate/core";
import { SKELETON } from "@blueprintjs/core/lib/cjs/common/classes";
import { remote } from "electron";
import { openStoreInEditor } from "../services/storage-service";
import ButtonLink from "../components/button-link";
import ErrorBoundary from "../components/error-boundary";

const getModuleView = (id) => React.memo(React.lazy(() => import(`../modules/${id}/settings`)));

function SettingCard({ moduleState }) {
  const moduleConfiguration = useStateLink(moduleState);
  const { name, enabled, id } = moduleConfiguration.get();
  const ModuleView = getModuleView(id);

  return (
    <Card elevation={Elevation.TWO}>
      <div style={{ display: "flex " }}>
        <div style={{ flexGrow: 1 }}>
          <H5>{name}</H5>
        </div>
        <div>
          <Switch
            label="Enabled"
            onChange={() =>
              moduleConfiguration.nested.enabled.set(!moduleConfiguration.nested.enabled.get())
            }
            checked={enabled}
            alignIndicator="right"
          />
        </div>
      </div>
      <Suspense fallback={<div className={SKELETON} style={{ height: "200px" }} />}>
        {enabled && <ModuleView configurationState={moduleConfiguration} />}
      </Suspense>
    </Card>
  );
}

function UIPreferences({ store }) {
  const configuration = useStateLink(store);

  const { highlightResults, theme } = configuration.nested;

  return (
    <Card elevation={Elevation.TWO}>
      <FormGroup label="Theme" labelFor="theme-selector">
        <HTMLSelect
          id="theme-selector"
          value={theme.get()}
          options={["system", "light", "dark"]}
          onChange={(e) => {
            theme.set(e.target.value);
            if (remote.nativeTheme.shouldUseDarkColors && theme.get() !== "light") {
              document.body.classList.add("bp3-dark");
            } else {
              document.body.classList.remove("bp3-dark");
            }
          }}
        />
      </FormGroup>
      <FormGroup label="Search results" labelFor="highlight">
        <Switch
          id="highlight"
          label="Highlight keywords in search results"
          checked={highlightResults.get()}
          onChange={() => {
            highlightResults.set(!highlightResults.get());
            if (highlightResults.get()) {
              document.body.classList.remove("no-highlight");
            } else {
              document.body.classList.add("no-highlight");
            }
          }}
        />
      </FormGroup>
    </Card>
  );
}

export function SettingsView({ store }) {
  const configuration = useStateLink(store);
  const modules = configuration.nested.modules;

  return (
    <div>
      <div className={styles.settingsHeader}>
        <div style={{ flexGrow: 1 }}>
          <H1>Settings</H1>
          <p>{"Credentials and keys are securely stored in the system's keychain."}</p>
        </div>
        <div>
          <ButtonLink minimal rightIcon="cross" to="/">
            Close
          </ButtonLink>
        </div>
      </div>
      <div className={styles.settingsBody}>
        <H4>Appearance</H4>
        <UIPreferences store={configuration.nested.appearance} />
        <H4>Modules</H4>
        {Object.entries(modules.nested).map(([moduleId, moduleState]) => (
          <ErrorBoundary key={moduleId}>
            <SettingCard moduleState={moduleState} />
          </ErrorBoundary>
        ))}
        {process.env.NODE_ENV !== "production" && (
          <div>
            <Button icon="document-open" minimal onClick={openStoreInEditor}>
              Open settings in editor
            </Button>
          </div>
        )}
      </div>
    </div>
  );
}
