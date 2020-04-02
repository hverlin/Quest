import React, { Suspense } from "react";
import { Link } from "react-router-dom";
import { Card, Elevation, H1, Icon } from "@blueprintjs/core";
import { modules } from "../configuration";

function SettingCard({ children, loading = false }) {
  return (
    <Card
      className={loading ? "bp3-skeleton" : ""}
      elevation={Elevation.TWO}
      style={{ height: loading ? "200px" : "" }}
    >
      {children}
    </Card>
  );
}

export function SettingsView() {
  return (
    <div className="settings-view">
      <div className="settings-header">
        <Link to="/">
          <Icon icon="arrow-left" />
          <span style={{ marginLeft: "2px" }}>Back</span>
        </Link>
        <H1>Settings</H1>
        <p>
          Credentials and keys are securely stored in the system's keychain.
        </p>
      </div>
      <div className="settings-body stack">
        {Object.keys(modules).map((moduleName) => {
          const Module = React.lazy(() =>
            import(
              /* webpackPrefetch: true */
              `../modules/${moduleName}/settings`
            )
          );

          return (
            <Suspense fallback={<SettingCard loading />}>
              <SettingCard>
                <Module />
              </SettingCard>
            </Suspense>
          );
        })}
      </div>
    </div>
  );
}
