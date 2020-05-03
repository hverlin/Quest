import React, { Suspense } from "react";
import _ from "lodash";
import {
  Button,
  Card,
  EditableText,
  Elevation,
  FormGroup,
  H1,
  H4,
  H5,
  HTMLSelect,
  HTMLTable,
  MenuItem,
  Switch,
} from "@blueprintjs/core";
import styles from "./settings-view.module.css";

import { useStateLink } from "@hookstate/core";
import { remote } from "electron";
import ButtonLink from "../components/button-link";
import ErrorBoundary from "../components/error-boundary";
import { Select } from "@blueprintjs/select";
import configurationSchema from "../configuration-schema.json";
import { v4 as uuidv4 } from "uuid";
import configSchema from "../configuration-schema.json";
import { Shortcut } from "shortcuts";
import { useShortcut } from "../services/shortcut-manager";
import { Redirect } from "react-router-dom";
import { DndProvider } from "react-dnd";
import Backend from "react-dnd-html5-backend";
import SortableList from "../components/sortable-list/sortable-list";
import { ExternalLink } from "../components/external-link";

const availableModules = configurationSchema.properties.modules.items.oneOf.map((item) => ({
  type: item.properties.moduleType.const,
  name: item.properties.name.default,
}));

const moduleSchemaByType = _.keyBy(
  configurationSchema.properties.modules.items.oneOf,
  "properties.moduleType.const"
);

function createDefaultValuesForModule(moduleType) {
  const moduleSchema = moduleSchemaByType[moduleType];
  return Object.fromEntries(
    Object.entries(moduleSchema.properties).map(([propertyName, property]) => {
      const value =
        property.format === "uuid" ? uuidv4() : property.const ? property.const : property.default;
      return [propertyName, value];
    })
  );
}

const getModuleView = (id) => React.memo(React.lazy(() => import(`../modules/${id}/settings`)));

function SettingCardHeader({ configurationState }) {
  const moduleConfiguration = useStateLink(configurationState);
  const { name, enabled } = moduleConfiguration.get();

  return (
    <div style={{ display: "flex " }}>
      <div style={{ flexGrow: 1 }}>
        <H5>
          <EditableText
            maxLength={35}
            value={name}
            placeholder="Module name"
            onChange={(val) => moduleConfiguration.nested.name.set(val)}
          />
        </H5>
      </div>

      <div>
        <Switch
          label={enabled ? "Enabled" : "Disabled"}
          onChange={() =>
            moduleConfiguration.nested.enabled.set(!moduleConfiguration.nested.enabled.get())
          }
          checked={enabled}
          alignIndicator="right"
        />
      </div>
    </div>
  );
}

function SettingCard({ moduleState, onDelete }) {
  const moduleConfiguration = useStateLink(moduleState);
  const { moduleType, id } = moduleConfiguration.get();
  const ModuleView = getModuleView(moduleType);

  return (
    <Card elevation={Elevation.TWO}>
      <SettingCardHeader configurationState={moduleConfiguration} />
      <Suspense fallback={<div />}>
        <ModuleView configurationState={moduleConfiguration} />
      </Suspense>
      <div style={{ display: "flex", justifyContent: "flex-end" }}>
        <Button icon="trash" minimal intent="danger" onClick={() => onDelete(id)}>
          Remove
        </Button>
      </div>
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

function reorderModules(configuration, items) {
  const modules = configuration.nested.modules.get();
  const modulesById = _.keyBy(modules, "id");
  configuration.nested.modules.set(_.cloneDeep(items.map(({ itemId }) => modulesById[itemId])));
}

function moduleItemRenderer(module, { handleClick, modifiers: { matchesPredicate, active } = {} }) {
  if (!matchesPredicate) {
    return null;
  }

  return <MenuItem key={module.type} active={active} onClick={handleClick} text={module.name} />;
}

export function SettingsView({ store }) {
  const configuration = useStateLink(store);
  const [isClosed, setIsClosed] = React.useState(false);
  const [isReordering, setIsReordering] = React.useState(false);
  const [items, setItems] = React.useState([]);

  useShortcut("close", () => setIsClosed(true));
  if (isClosed) {
    return <Redirect to="/" />;
  }

  function onReorderingClicked() {
    if (isReordering) {
      setIsReordering(false);
      reorderModules(configuration, items);
    } else {
      setItems(
        configuration.nested.modules.nested.map((module, id) => ({
          id,
          itemId: module.nested.id.get(),
          text: module.nested.name.get(),
        }))
      );
      setIsReordering(true);
    }
  }

  return (
    <div>
      <div className={styles.settingsHeader}>
        <div style={{ flexGrow: 1 }}>
          <H1>Settings</H1>
          <p>{"Credentials and keys are stored encrypted."}</p>
        </div>
        <div>
          <ButtonLink minimal rightIcon="cross" to="/">
            Close
          </ButtonLink>
        </div>
      </div>
      <div className={styles.settingsBody}>
        <H4>Modules</H4>
        <div style={{ display: "flex" }}>
          <Select
            disabled={isReordering}
            itemPredicate={(query, module) =>
              module.name.toLowerCase().indexOf(query.toLowerCase()) >= 0
            }
            items={availableModules}
            itemRenderer={moduleItemRenderer}
            onItemSelect={(module) => {
              configuration.nested.modules.set((modules) =>
                modules.concat(createDefaultValuesForModule(module.type))
              );
            }}
          >
            <Button disabled={isReordering} icon="plus">
              Add search module
            </Button>
          </Select>
          <div style={{ flexGrow: "1" }} />
          <Button
            disabled={configuration.nested.modules.get().length < 2}
            minimal={!isReordering}
            intent={isReordering ? "primary" : "none"}
            icon={isReordering ? "small-tick" : "swap-vertical"}
            onClick={onReorderingClicked}
          >
            {isReordering ? "Done" : "Reorder"}
          </Button>
        </div>
        {isReordering && (
          <DndProvider backend={Backend}>
            <SortableList initialItems={items} onChange={setItems} />
          </DndProvider>
        )}
        {!isReordering &&
          configuration.nested.modules.nested.map((moduleState) => (
            <ErrorBoundary key={moduleState.nested.id.get()}>
              <SettingCard
                moduleState={moduleState}
                onDelete={(id) =>
                  configuration.nested.modules.set((modules) =>
                    modules.filter((module) => module.id !== id)
                  )
                }
              />
            </ErrorBoundary>
          ))}
        <H4>Appearance</H4>
        <UIPreferences store={configuration.nested.appearance} />
        <H4>Shortcuts</H4>
        <p>
          Use <kbd>Tab</kbd> and the arrow keys to navigate between the search results.
        </p>
        <Card>
          <HTMLTable style={{ border: "none", width: "100%" }}>
            <tbody>
              {Object.entries(configSchema.properties.shortcuts.properties).map(([id, action]) => (
                <tr key={id}>
                  <td style={{ borderLeft: "none", boxShadow: "none" }}>{action.description}</td>
                  <td style={{ borderLeft: "none", boxShadow: "none", textAlign: "right" }}>
                    <kbd className={styles.shortcut}>
                      {Shortcut.shortcut2symbols(action.default)}
                    </kbd>
                  </td>
                </tr>
              ))}
            </tbody>
          </HTMLTable>
        </Card>
        <div style={{ display: "flex" }}>
          <ButtonLink icon="cog" minimal to="/json-config">
            Edit configuration
          </ButtonLink>
          <div style={{ flexGrow: 1 }} />
          <ExternalLink href="https://github.com/hverlin/Quest">
            Learn more about Quest
          </ExternalLink>
        </div>
      </div>
    </div>
  );
}
