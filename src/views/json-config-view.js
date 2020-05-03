import _ from "lodash";
import React, { Suspense } from "react";

import ButtonLink from "../components/button-link";
import { Button, Spinner } from "@blueprintjs/core";

import styles from "./json-config-view.module.css";
import { notify } from "../services/notification-service";
import { useShortcut } from "../services/shortcut-manager";

export function JsonConfigView({ store }) {
  let config = _.cloneDeep(store.get());

  async function saveConfiguration() {
    try {
      await store.set(config);
      notify("configuration saved successfully");
    } catch (e) {
      notify("Error when saving configuration");
    }
  }

  useShortcut("saveConfig", saveConfiguration);

  const JSONEditor = React.lazy(async () => {
    await import("brace");
    const [editor] = await Promise.all([
      import("jsoneditor-react"),
      import("brace/theme/monokai"),
      import("brace/mode/json"),
    ]);
    return { default: editor.JsonEditor };
  });

  return (
    <div>
      <div className={styles.header}>
        <Button onClick={saveConfiguration} style={{ height: 35 }} minimal icon="tick">
          save
        </Button>
        <ButtonLink to="/settings" style={{ height: 35 }} minimal icon="cross">
          close
        </ButtonLink>
      </div>
      <div className={styles.jsonEditor}>
        <Suspense fallback={<Spinner />}>
          <JSONEditor
            onChange={(val) => (config = val)}
            theme="ace/theme/monokai"
            mode="code"
            value={config}
          />
        </Suspense>
      </div>
    </div>
  );
}
