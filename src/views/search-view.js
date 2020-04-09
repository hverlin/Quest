import React, { Suspense } from "react";

import { Card, NonIdealState, } from "@blueprintjs/core";
import { Link } from "react-router-dom";
import { useStateLink } from "@hookstate/core";

import styles from './search-view.module.css';
import { SearchForm } from "../components/search-bar";
import * as PropTypes from "prop-types";

const getModuleView = (id) =>
  React.memo(React.lazy(() => import(`../modules/${id}`)));

function EmptyState(props) {
  return <div style={{marginTop: "3rem"}}>
    <NonIdealState
      icon="search"
      title="Search anything"
      description={
        props.enabledModules.length === 0
          ? "No search modules are configured."
          : "Try searching something. e.g. \"analytics\""
      }
      action={
        props.enabledModules.length === 0 ? (
          <Link to="/settings">Settings</Link>
        ) : undefined
      }
    />
  </div>;
}

export function SearchView({store}) {
  const configuration = useStateLink(store);
  const [searchData, setSearchData] = React.useState({input: ""});

  const enabledModules = Object.entries(
    configuration.nested.modules.nested
  ).filter(([, module]) => module.nested.enabled.get());

  return (
    <>
      <SearchForm onSubmit={(input) => setSearchData({input})}/>
      {searchData.input ? (
        <div className={styles.searchResults}>
          {enabledModules.map(([id, moduleState]) => {
            const ResultComponent = getModuleView(id);
            return (
              <Suspense key={id} fallback={<Card className='bp3-skeleton'/>}>
                <ResultComponent
                  searchData={searchData}
                  configuration={moduleState}
                />
              </Suspense>
            );
          })}
        </div>
      ) : (
        <EmptyState enabledModules={enabledModules}/>
      )}
    </>
  );
}
