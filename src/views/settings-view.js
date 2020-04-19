import React, { Suspense } from "react";
import { Link } from "react-router-dom";
import {
  Button,
  Card,
  Elevation,
  FormGroup,
  H1,
  H4,
  H5,
  HTMLSelect,
  Icon,
  Switch,
} from "@blueprintjs/core";
import styles from "./settings-view.module.css";

import { useStateLink } from "@hookstate/core";
import { SKELETON } from "@blueprintjs/core/lib/cjs/common/classes";
import { remote } from "electron";
import { openStoreInEditor } from "../services/storage-service";

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

  return (
    <Card elevation={Elevation.TWO}>
      <FormGroup label="Theme" labelFor="slack-token">
        <HTMLSelect
          value={configuration.nested.theme.get()}
          options={["system", "light", "dark"]}
          onChange={(e) => {
            configuration.nested.theme.set(e.target.value);
            if (
              remote.nativeTheme.shouldUseDarkColors &&
              configuration.nested.theme.get() !== "light"
            ) {
              document.body.classList.add("bp3-dark");
            } else {
              document.body.classList.remove("bp3-dark");
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
        <Link to="/">
          <Icon icon="arrow-left" />
          <span style={{ marginLeft: "2px" }}>Back</span>
        </Link>
        <H1>Settings</H1>
        <p>{"Credentials and keys are securely stored in the system's keychain."}</p>
      </div>
      <div className={styles.settingsBody}>
        <H4>Appearance</H4>
        <UIPreferences store={configuration.nested.appearance} />
        <H4>Modules</H4>
        {Object.entries(modules.nested).map(([moduleId, moduleState]) => (
          <SettingCard key={moduleId} moduleState={moduleState} />
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
