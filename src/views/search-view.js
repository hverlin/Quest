import React, { Suspense } from "react";
import { SearchCard } from "../components/search-card";

import { Button, InputGroup, NonIdealState, Tooltip } from "@blueprintjs/core";
import * as PropTypes from "prop-types";
import { Link } from "react-router-dom";
import { modules } from "../configuration";

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

SearchForm.propTypes = {
  onSubmit: PropTypes.func,
};

export function SearchView() {
  const [searchData, setSearchData] = React.useState({ input: "" });

  return (
    <>
      <SearchForm onSubmit={(input) => setSearchData({ input })} />
      {searchData.input && (
        <div className="search-results stack">
          {Object.keys(modules).map((key) => {
            const module = modules[key];
            const ResultComponent = React.lazy(() => import(`../modules/${module.id}`));

            return (
              <Suspense fallback={<SearchCard loading />}>
                <SearchCard name={modules[key].name}>
                  <ResultComponent searchData={searchData} />
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
            description='Try searching something. e.g. "azure"'
          />
        </div>
      )}
    </>
  );
}
