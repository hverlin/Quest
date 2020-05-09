import React, { Suspense } from "react";

import _ from "lodash";
import { Button, NonIdealState } from "@blueprintjs/core";
import { useStateLink } from "@hookstate/core";

import styles from "./search-view.module.css";
import { SearchForm } from "../components/search-bar/search-bar";
import ResizePanel from "../components/side-bar/side-bar";
import Highlighter from "../components/highlighter";
import SettingsBar from "../components/settings-bar/settings-bar";
import ButtonLink from "../components/button-link";
import ErrorBoundary from "../components/error-boundary";
import SearchString from "../shared/search-query-parser";

import icon from "../icon.svg";
import { useShortcut } from "../services/shortcut-manager";

const getModuleView = (id) => React.memo(React.lazy(() => import(`../modules/${id}`)));

function EmptyState({ hasModules = true }) {
  return (
    <div style={{ marginTop: "3rem", marginBottom: "1rem" }}>
      <NonIdealState
        icon={<img style={{ maxWidth: "100%" }} src={icon} />}
        title={!hasModules ? "No search modules configured" : ""}
        action={
          !hasModules ? (
            <ButtonLink minimal intent="primary" icon="settings" to="/settings">
              Settings
            </ButtonLink>
          ) : undefined
        }
      />
    </div>
  );
}

function Sidebar({ searchViewState }) {
  const state = useStateLink(searchViewState);
  const { selectedItem } = state.get();
  const contentRef = React.useRef(null);

  const closeSidebar = () => {
    const key = selectedItem?.__focusKey;
    state.nested.selectedItem.set(null);
    if (key) {
      document.querySelector(`[data-focus-key="${key}"]`)?.focus();
    }
  };

  useShortcut("close", closeSidebar);

  React.useEffect(() => {
    if (selectedItem) {
      contentRef.current.focus();
    }
  }, [selectedItem]);

  if (!selectedItem) {
    return null;
  }

  return (
    <ResizePanel>
      <ErrorBoundary>
        <Button
          title="Close"
          minimal
          onClick={closeSidebar}
          icon="cross"
          style={{ position: "fixed", right: 10, marginTop: 4 }}
        />
        <div className={styles.searchResultsSidebar} ref={contentRef} tabIndex={-1}>
          <Highlighter text={state.nested.input.get()}>
            {(window.detailView || _.noop)(state.get().selectedItem)}
          </Highlighter>
        </div>
      </ErrorBoundary>
    </ResizePanel>
  );
}

export function SearchView({ store }) {
  const configuration = useStateLink(store);
  const searchViewState = useStateLink({
    input: "",
    rawQuery: "",
    queryObj: {},
    selectedItem: null,
    renderer: null,
  });

  const enabledModules = configuration.nested.modules.nested.filter((module) =>
    module.nested.enabled.get()
  );

  const hasModules = enabledModules.length > 0;

  return (
    <div>
      <SearchForm
        onSubmit={(input) => {
          const searchQueryObj = SearchString.parse(input, {
            keywords: ["subject"],
            ranges: ["date"],
          });

          searchViewState.nested.rawQuery.set(input);
          searchViewState.nested.input.set(searchQueryObj.text ?? "");
          searchViewState.nested.queryObj.set(searchQueryObj);
          searchViewState.nested.selectedItem.set(null);
        }}
      />
      {searchViewState.nested.rawQuery.get() && hasModules ? (
        <div style={{ display: "flex" }}>
          <div className={styles.searchResults}>
            {enabledModules.map((moduleState) => {
              const ResultComponent = getModuleView(moduleState.nested.moduleType.get());
              return (
                <Suspense key={moduleState.nested.id.get()} fallback={<span />}>
                  <ErrorBoundary>
                    <ResultComponent
                      configuration={moduleState}
                      searchViewState={searchViewState}
                    />
                  </ErrorBoundary>
                </Suspense>
              );
            })}
          </div>
          <Sidebar searchViewState={searchViewState} />
        </div>
      ) : (
        <EmptyState hasModules={hasModules} />
      )}
      <SettingsBar configuration={configuration}>Settings</SettingsBar>
    </div>
  );
}
