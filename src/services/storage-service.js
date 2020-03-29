import Store from "electron-store";

const store = new Store();

export function storeSetting(key, value) {
  store.set(key, value);
}

export function getSetting(key) {
  return store.get(key);
}
