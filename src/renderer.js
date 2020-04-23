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

const args = window.process.argv;

const theme = args.find((a) => a.startsWith("--theme")).split("=")[1];

if (remote.nativeTheme.shouldUseDarkColors && theme !== "light") {
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
  const encryptionKey = args.find((a) => a.startsWith("--encryptionKey")).split("=")[1];
  const store = await initializeStore({
    isProduction: process.env.NODE_ENV === "production",
    encryptionKey,
  });

  if (!store.nested.appearance.nested.highlightResults.get()) {
    document.body.classList.add("no-highlight");
  }

  ReactDOM.render(<App store={store} />, document.getElementById("app"));
})();
