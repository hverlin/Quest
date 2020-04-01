import keytar from "keytar";
const SERVICE_NAME = "my-search";

export async function saveCredential(credentialName, value) {
  return keytar.setPassword(SERVICE_NAME, credentialName, value);
}

export async function getCredential(credentialName) {
  return keytar.getPassword(SERVICE_NAME, credentialName);
}

export async function deleteCredential(credentialName) {
  return keytar.deletePassword(SERVICE_NAME, credentialName);
}
