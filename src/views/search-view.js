import React, { Suspense } from "react";
import { SearchCard } from "../components/search-card";

import { Button, InputGroup, NonIdealState, Tooltip } from "@blueprintjs/core";
import { Link } from "react-router-dom";
import { useStateLink } from "@hookstate/core";

const getModuleView = (id) =>
  React.memo(React.lazy(() => import(`../modules/${id}`)));

export function SearchForm({ onSubmit }) {
  const [input, setInput] = React.useState("");

  function _onSubmit(e) {
    e.preventDefault();
    onSubmit(input);
  }

  const searchButton = (
    <Tooltip content="Hit Enter to search">
      <Button icon="key-enter" minimal={true} onClick={_onSubmit} />
    </Tooltip>
  );

  return (
    <div className="search-form">
      <form onSubmit={_onSubmit}>
        <InputGroup
          autoFocus
          large
          placeholder="Search something..."
          value={input}
          onChange={(e) => setInput(e.target.value)}
          type="text"
          rightElement={searchButton}
        />
      </form>
      <div style={{ marginTop: "10px" }}>
        <Link to="/settings">Settings</Link>
      </div>
    </div>
  );
}

export function SearchView({ store }) {
  const configuration = useStateLink(store);
  const [searchData, setSearchData] = React.useState({ input: "" });

  const enabledModules = Object.entries(
    configuration.nested.modules.nested
  ).filter(([, module]) => module.nested.enabled.get());

  return (
    <>
      <SearchForm onSubmit={(input) => setSearchData({ input })} />
      {searchData.input && (
        <div className="search-results stack">
          {enabledModules.map(([id, moduleState]) => {
            const { name } = moduleState.get();
            const ResultComponent = getModuleView(id);

            return (
              <Suspense key={id} fallback={<SearchCard loading />}>
                <SearchCard name={name}>
                  <ResultComponent
                    searchData={searchData}
                    configuration={moduleState}
                  />
                </SearchCard>
              </Suspense>
            );
          })}
        </div>
      )}
      {!searchData.input && (
        <div style={{ marginTop: "3rem" }}>
          <NonIdealState
            icon="search"
            title="Search anything"
            description={
              enabledModules.length === 0
                ? "No search modules are configured."
                : 'Try searching something. e.g. "analytics"'
            }
            action={
              enabledModules.length === 0 ? (
                <Link to="/settings">Settings</Link>
              ) : undefined
            }
          />
        </div>
      )}
    </>
  );
}
