import _ from "lodash";
import Store from "electron-store";
import schema from "../configuration-schema";
import { Logger } from "@hookstate/logger";
import { createStateLink } from "@hookstate/core";

function Persistence(localStore) {
  function storeState(state) {
    localStore.set(state);
  }
  const _store = _.debounce(storeState, 100);

  return () => ({
    id: Symbol("LocalPersistence"),
    create: (state) => {
      if (!state.promised) {
        localStore.set(state.value);
      }
      return {
        onSet: async (p) => {
          if ("state" in p) {
            _store(p.state);
          } else {
            localStore.reset();
          }
        },
      };
    },
  });
}

export function initializeStore({ isProduction = false, encryptionKey } = {}) {
  const localStore = new Store({ schema: schema.properties, encryptionKey });

  const stateLink = createStateLink(localStore.store).with(Persistence(localStore));
  return isProduction ? stateLink : stateLink.with(Logger);
}
