import React, { Suspense } from "react";
import { Link } from "react-router-dom";
import { Card, Elevation, H1, H5, Icon, Switch } from "@blueprintjs/core";
import styles from './settings-view.module.css'

import { useStateLink } from "@hookstate/core";

const getModuleView = (id) =>
  React.memo(React.lazy(() => import(`../modules/${id}/settings`)));

function SettingCard({ moduleState }) {
  const moduleConfiguration = useStateLink(moduleState);
  const { name, enabled, id } = moduleConfiguration.get();
  const ModuleView = getModuleView(id);

  return (
    <Card elevation={Elevation.TWO}>
      <div style={{ display: "flex " }}>
        <div style={{ flexGrow: 1 }}>
          <H5> {name}</H5>
        </div>
        <div>
          <Switch
            label="Enabled"
            onChange={() =>
              moduleConfiguration.nested.enabled.set(
                !moduleConfiguration.nested.enabled.get()
              )
            }
            checked={enabled}
            alignIndicator="right"
          />
        </div>
      </div>
      <Suspense
        fallback={<div className="bp3-skeleton" style={{ height: "200px" }} />}
      >
        {enabled && <ModuleView configurationState={moduleConfiguration} />}
      </Suspense>
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
        <p>
          Credentials and keys are securely stored in the system's keychain.
        </p>
      </div>
      <div className={styles.settingsBody}>
        {Object.entries(modules.nested).map(([moduleId, moduleState]) => (
          <SettingCard key={moduleId} moduleState={moduleState} />
        ))}
      </div>
    </div>
  );
}
