import React from "react";
import { Link } from "react-router-dom";
import { Card, Elevation, H1, Icon } from "@blueprintjs/core";
import { JiraSettings } from "../modules/jira/settings";
import { ConfluenceSettings } from "../modules/confluence/settings";
import { SlackSettings } from "../modules/slack/settings";
import { DriveSettings } from "../modules/drive/settings";
import { PaperSettings } from "../modules/paper/settings";

function SettingCard({ children }) {
  return (
    <Card elevation={Elevation.TWO} style={{ marginBottom: "10px" }}>
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
      <div className="settings-body">
        <SettingCard>
          <JiraSettings />
        </SettingCard>
        <SettingCard>
          <ConfluenceSettings />
        </SettingCard>
        <SettingCard>
          <SlackSettings />
        </SettingCard>
        <SettingCard>
          <DriveSettings />
        </SettingCard>
        <SettingCard>
          <PaperSettings />
        </SettingCard>
      </div>
    </div>
  );
}
