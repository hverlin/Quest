import { Toaster } from "@blueprintjs/core";

const toaster = Toaster.create({ position: "top" });

export function notify(msg, opts) {
  toaster.show(Object.assign({ timeout: 2000 }, opts, { message: msg }));
}
