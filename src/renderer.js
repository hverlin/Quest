/**
 * This file is automatically be loaded by webpack and run in the "renderer" context.
 * see https://electronjs.org/docs/tutorial/application-architecture#main-and-renderer-processes
 *
 * Node.js integration is enabled (https://electronjs.org/docs/tutorial/security)
 */

import "@blueprintjs/core/lib/css/blueprint.css";
import "./index.css";

import ReactDOM from "react-dom";
import React from "react";
import App from "./app";
import { initializeStore } from "./services/storage-service";
import { FocusStyleManager } from "@blueprintjs/core";
import spatialNavigation from "spatial-navigation-js";

import { remote } from "electron";

if (remote.nativeTheme.shouldUseDarkColors) {
  document.body.classList.add("bp3-dark");
}

function setupGlobalKeyboardNavigation() {
  FocusStyleManager.onlyShowFocusOnTabs();
  spatialNavigation.init();

  spatialNavigation.add({ selector: ".focusable" });

  window.addEventListener("keydown", (e) => {
    if (e.target.classList.contains("focusable")) {
      return true;
    }

    if (["ArrowDown", "ArrowUp", "ArrowLeft", "ArrowRight"].includes(e.key)) {
      e.target?.closest(".focusable")?.focus();
    }
  });
}

setupGlobalKeyboardNavigation();

(async () => {
  const store = await initializeStore({
    isProduction: process.env.NODE_ENV === "production",
  });
  ReactDOM.render(<App store={store} />, document.getElementById("app"));
})();
