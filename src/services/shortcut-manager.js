import _ from "lodash";
import React from "react";
import { Shortcuts } from "shortcuts";

class ShortcutsManager {
  constructor() {
    this.shortcuts = new Shortcuts();
  }

  initialize(actions) {
    this.reset();
    this._setActions(actions);
  }

  reset() {
    this.shortcuts.reset();
    this.registeredActions = new Map();
    this._setActions([]);
  }

  register({ actionId, handler }) {
    if (!this.actionsById[actionId]) {
      return;
    }
    this.registeredActions.set(actionId, handler);
    const { shortcut } = this.actionsById[actionId];
    this.shortcuts.add({
      shortcut,
      handler: (event) => {
        handler(event);
        return true;
      },
    });
  }

  _setActions(actions) {
    this.actions = actions;
    this.actionsById = _.keyBy(this.actions, "id");
  }

  get() {
    return this.shortcuts.get();
  }

  remove({ actionId }) {
    if (!this.actionsById[actionId]) {
      return;
    }

    const { shortcut } = this.actionsById[actionId];
    this.shortcuts.remove({ shortcut });
  }
}

const shortcutsManager = new ShortcutsManager();

const useShortcut = (actionId, handler) => {
  React.useEffect(() => {
    shortcutsManager.register({
      actionId,
      handler,
    });

    return () => shortcutsManager.remove({ actionId, handler });
  }, [actionId, handler]);
};

function ShortcutPlugin() {
  return {
    id: Symbol("ShortcutPlugin"),
    create: (state) => {
      if (!state.promised) {
        const actions = Object.entries(state.value.shortcuts).map(([id, shortcut]) => ({
          id,
          shortcut,
        }));
        shortcutsManager.initialize(actions);
      }
      return {
        // TODO
      };
    },
  };
}

export { useShortcut, ShortcutPlugin };
export default shortcutsManager;
