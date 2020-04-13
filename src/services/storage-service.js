import Store from "electron-store";
import schema from "../configuration-schema";
import { Logger } from "@hookstate/logger";
import _ from "lodash";
import { createStateLink } from "@hookstate/core";
import { getCredential, saveCredential, deleteCredential } from "./credential-service";
import log from "electron-log";

function getHiddenKeys(schema, keyPrefix = null) {
  if (schema.properties) {
    return Object.keys(schema.properties).flatMap((key) =>
      getHiddenKeys(schema.properties[key], keyPrefix ? `${keyPrefix}.${key}` : key)
    );
  }

  // leaf; keyPrefix is a key
  if (schema.isPassword) {
    return [{ key: keyPrefix, value: schema.default }];
  }

  return [];
}

const hiddenKeys = getHiddenKeys(schema);

function filterState(state) {
  const filteredState = _.cloneDeep(state);
  hiddenKeys.forEach(({ key, value }) => _.set(filteredState, key, value));
  return filteredState;
}

async function saveCredentials(state) {
  await Promise.all(
    hiddenKeys.map(async ({ key, value }) => {
      try {
        const credential = _.get(state, key);
        if (credential != null) {
          await saveCredential(value, credential);
        } else {
          await deleteCredential(value);
        }
      } catch (e) {
        log.error(key, value, e);
      }
    })
  );
}

function Persistence(localStore) {
  return () => ({
    id: Symbol("LocalPersistence"),
    create: (state) => {
      if (!state.promised) {
        localStore.set(filterState(state.value));
      }
      return {
        onSet: async (p) => {
          if ("state" in p) {
            localStore.set(filterState(p.state));
            await saveCredentials(p.state);
          } else {
            localStore.reset();
          }
        },
      };
    },
  });
}

export async function initializeStore({ isProduction = false } = {}) {
  const localStore = new Store({ schema: schema.properties });
  const data = await localStore.store;
  if (_.isEmpty(data)) {
    // ensure that configuration is initialized on disk.
    // TODO: Find a better way to do this.
    location.reload();
  }

  const credentials = await Promise.all(
    hiddenKeys.map(async ({ key, value }) => ({
      credential: await getCredential(value),
      key,
    }))
  );

  credentials.forEach(({ credential, key }) => _.set(data, key, credential));

  const stateLink = createStateLink(data).with(Persistence(localStore));
  return isProduction ? stateLink : stateLink.with(Logger);
}
