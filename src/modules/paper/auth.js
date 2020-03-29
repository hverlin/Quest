import {
  getCredential,
  saveCredential,
} from "../../services/credential-service";

const PAPER_TOKEN = "paper-token";

export async function getPaperToken() {
  return getCredential(PAPER_TOKEN);
}

export async function savePaperToken(token) {
  return saveCredential(PAPER_TOKEN, token);
}
