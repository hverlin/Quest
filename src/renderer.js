/**
 * This file is automatically be loaded by webpack and run in the "renderer" context.
 * see https://electronjs.org/docs/tutorial/application-architecture#main-and-renderer-processes
 *
 * Node.js integration is enabled (https://electronjs.org/docs/tutorial/security)
 */

import "v8-compile-cache";

import "@blueprintjs/core/lib/css/blueprint.css";
import "./index.css";

import ReactDOM from "react-dom";
import React from "react";
import App from "./app";
import { initializeStore } from "./services/storage-service";
import { FocusStyleManager } from "@blueprintjs/core";
import spatialNavigation from "spatial-navigation-js";
import { ShortcutPlugin } from "./services/shortcut-manager";
import { ThemeManager } from "./services/theme-service";
import { LayoutManager } from "./services/layout-service";

ThemeManager.setInitialTheme();

function resetFocusManager() {
  FocusStyleManager.alwaysShowFocus();
  FocusStyleManager.onlyShowFocusOnTabs();
}

function setupGlobalKeyboardNavigation() {
  FocusStyleManager.onlyShowFocusOnTabs();
  spatialNavigation.init();

  spatialNavigation.add({ selector: ".focusable" });

  window.addEventListener("keydown", (e) => {
    if (e.target.classList.contains("focusable")) {
      resetFocusManager();
      return true;
    }

    if (["ArrowDown", "ArrowUp", "ArrowLeft", "ArrowRight"].includes(e.key)) {
      e.target?.closest(".focusable")?.focus();
      resetFocusManager();
    }
  });
}

setupGlobalKeyboardNavigation();

const encryptionKey = window.process.argv
  .find((a) => a.startsWith("--encryptionKey"))
  .split("=")[1];

const store = initializeStore({
  isProduction: process.env.NODE_ENV === "production",
  encryptionKey,
}).with(ShortcutPlugin);

ThemeManager.on("change:theme", (theme) =>
  store.access().nested.appearance.nested.theme.set(theme)
);

LayoutManager.setInitialLayout(store.access().nested.appearance.nested.layout.get());
LayoutManager.on("change:layout", (layout) =>
  store.access().nested.appearance.nested.layout.set(layout)
);

if (!store.nested.appearance.nested.highlightResults.get()) {
  document.body.classList.add("no-highlight");
}

ReactDOM.render(<App store={store} />, document.getElementById("app"));
