import React from "react";
import { HashRouter, Route, Switch } from "react-router-dom";

import { SWRConfig } from "swr";

import { SearchView } from "./views/search-view";
import { SettingsView } from "./views/settings-view";

const swrConfig = {
  refreshInterval: 0,
  revalidateOnFocus: false,
  fetcher: async function (url) {
    const res = await fetch(url, { credentials: "omit" });
    return res.json();
  },
};

function App() {
  return (
    <SWRConfig value={swrConfig}>
      <HashRouter>
        <Switch>
          <Route path="/settings">
            <SettingsView />
          </Route>
          <Route path="/">
            <SearchView />
          </Route>
        </Switch>
      </HashRouter>
    </SWRConfig>
  );
}

export default App;
