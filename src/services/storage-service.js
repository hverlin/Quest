import _ from "lodash";
import Store from "electron-store";
import schema from "../configuration-schema";
import { Logger } from "@hookstate/logger";
import { createStateLink } from "@hookstate/core";
import electron from "electron";
import log from "electron-log";
import Ajv from "ajv";

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

function getDefaultValues() {
  const ajv = new Ajv({
    allErrors: true,
    format: "full",
    useDefaults: true,
    errorDataPath: "property",
  });

  const defaultValues = {};
  const validate = ajv.compile(schema);

  validate(defaultValues);
  return defaultValues;
}

export function initializeStore({ isProduction = false, encryptionKey } = {}) {
  const configPath = (electron.app || electron.remote.app).getPath("userData");
  log.info(`saving data in ${configPath}`);

  const localStore = new Store({
    name: isProduction ? "config" : "dev-config",
    encryptionKey,
  });

  if (_.size(localStore.store) === 0) {
    localStore.set(getDefaultValues());
  }

  const stateLink = createStateLink(localStore.store).with(Persistence(localStore));
  return isProduction ? stateLink : stateLink.with(Logger);
}
