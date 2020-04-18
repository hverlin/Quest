import React, { Suspense } from "react";

import _ from "lodash";
import { Button, NonIdealState } from "@blueprintjs/core";
import { Link } from "react-router-dom";
import { useStateLink } from "@hookstate/core";

import styles from "./search-view.module.css";
import { SearchForm } from "../components/search-bar";
import ResizePanel from "../components/side-bar";
import Highlighter from "../components/highlighter";

const getModuleView = (id) => React.memo(React.lazy(() => import(`../modules/${id}`)));

function EmptyState({ enabledModules = [] }) {
  return (
    <div style={{ marginTop: "3rem" }}>
      <NonIdealState
        icon="search"
        title="Search anything"
        description={
          enabledModules.length === 0
            ? "No search modules configured."
            : 'Try searching something. e.g. "analytics"'
        }
        action={enabledModules.length === 0 ? <Link to="/settings">Settings</Link> : undefined}
      />
    </div>
  );
}

function Sidebar({ searchViewState }) {
  const state = useStateLink(searchViewState);
  const { selectedItem } = state.get();
  const contentRef = React.useRef(null);

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
      <>
        <Button
          title="Close"
          minimal
          onClick={() => state.nested.selectedItem.set(null)}
          icon="cross"
          style={{ position: "fixed", right: 10, marginTop: 4 }}
        />
        <div className={styles.searchResultsSidebar} ref={contentRef} tabIndex={-1}>
          <Highlighter text={state.nested.input.get()}>
            {(window.detailView || _.noop)(state.get().selectedItem)}
          </Highlighter>
        </div>
      </>
    </ResizePanel>
  );
}

export function SearchView({ store }) {
  const configuration = useStateLink(store);
  const searchViewState = useStateLink({ input: "", selectedItem: null, renderer: null });

  const enabledModules = Object.entries(configuration.nested.modules.nested).filter(([, module]) =>
    module.nested.enabled.get()
  );

  return (
    <>
      <SearchForm
        onSubmit={(input) => {
          searchViewState.nested.input.set(input);
          searchViewState.nested.selectedItem.set(null);
        }}
      />
      {searchViewState.nested.input.get() ? (
        <div style={{ display: "flex" }}>
          <div className={styles.searchResults}>
            {enabledModules.map(([id, moduleState]) => {
              const ResultComponent = getModuleView(id);
              return (
                <Suspense key={id} fallback={<span />}>
                  <ResultComponent configuration={moduleState} searchViewState={searchViewState} />
                </Suspense>
              );
            })}
          </div>
          <Sidebar searchViewState={searchViewState} />
        </div>
      ) : (
        <EmptyState enabledModules={enabledModules} />
      )}
    </>
  );
}
