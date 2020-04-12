import React from "react";
import { HashRouter, Route, Switch } from "react-router-dom";

import { SWRConfig } from "swr";

import { SearchView } from "./views/search-view";
import { SettingsView } from "./views/settings-view";

import { FocusStyleManager } from "@blueprintjs/core";

FocusStyleManager.onlyShowFocusOnTabs();

const swrConfig = {
  refreshInterval: 0,
  revalidateOnFocus: false,
  fetcher: async function (url) {
    const res = await fetch(url, { credentials: "omit" });
    return res.json();
  },
};

function App({ store }) {
  return (
    <SWRConfig value={swrConfig}>
      <HashRouter>
        <Switch>
          <Route path="/settings">
            <SettingsView store={store} />
          </Route>
          <Route path="/">
            <SearchView store={store} />
          </Route>
        </Switch>
      </HashRouter>
    </SWRConfig>
  );
}

export default App;
