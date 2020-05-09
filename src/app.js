import React from "react";
import { HashRouter, Route, Switch, useLocation } from "react-router-dom";
import { CSSTransition, TransitionGroup } from "react-transition-group";
import { SearchView } from "./views/search-view";
import { SettingsView } from "./views/settings-view";
import { JsonConfigView } from "./views/json-config-view";
import ErrorBoundary from "./components/error-boundary";
import { ExternalLink } from "./components/external-link";
import { ReactQueryConfigProvider } from "react-query";

const queryConfig = {
  // useQuery
  retry: 3,
  refetchInterval: false,
  refetchOnMount: true,
  refetchAllOnWindowFocus: false,
};

function AppBody({ store }) {
  const location = useLocation();

  return (
    <TransitionGroup enter={location.pathname !== "/"} exit={location.pathname === "/"}>
      <CSSTransition key={location.pathname} classNames="fade" timeout={300}>
        <Switch location={location}>
          <Route path="/settings">
            <SettingsView store={store} />
          </Route>
          <Route path="/json-config">
            <JsonConfigView store={store} />
          </Route>
          <Route path="/">
            <SearchView store={store} />
          </Route>
        </Switch>
      </CSSTransition>
    </TransitionGroup>
  );
}

function App({ store }) {
  return (
    <ReactQueryConfigProvider config={queryConfig}>
      <HashRouter>
        <ErrorBoundary
          displayStacktrace
          message={
            <div>
              <ExternalLink href="https://github.com/hverlin/Quest/issues">
                Report an issue on Github
              </ExternalLink>
            </div>
          }
        >
          <AppBody store={store} />
        </ErrorBoundary>
      </HashRouter>
    </ReactQueryConfigProvider>
  );
}

export default App;
