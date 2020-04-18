import React from "react";
import { Button, InputGroup, Tooltip } from "@blueprintjs/core";
import styles from "./search-bar.module.css";
import { Redirect } from "react-router-dom";

export function SearchForm({ onSubmit }) {
  const [input, setInput] = React.useState("");
  const [redirect, setRedirect] = React.useState(false);
  const inputRef = React.useRef();

  function focusInput(event) {
    if (event.key === "/" && event.target.tagName !== "INPUT") {
      event.stopPropagation();
      event.preventDefault();
      inputRef?.current?.focus();
    }
  }

  React.useEffect(() => {
    window.addEventListener("keydown", focusInput);
    return () => window.removeEventListener("mouseup", focusInput);
  }, []);

  if (redirect) {
    return <Redirect to="/settings" />;
  }

  function _onSubmit(e) {
    e.preventDefault();
    onSubmit(input);
  }

  const searchButton = (
    <Tooltip content="Hit Enter to search" openOnTargetFocus={false}>
      <Button icon="key-enter" minimal onClick={_onSubmit} tabIndex={-1} />
    </Tooltip>
  );

  return (
    <div className={styles.searchForm}>
      <form onSubmit={_onSubmit} style={{ display: "flex" }}>
        <InputGroup
          inputRef={inputRef}
          autoFocus
          large
          placeholder="Search something..."
          value={input}
          onChange={(e) => setInput(e.target.value)}
          type="text"
          rightElement={searchButton}
        />
        <Tooltip content="Settings" className={styles.settings}>
          <Button onClick={() => setRedirect(true)} minimal icon="settings" />
        </Tooltip>
      </form>
    </div>
  );
}
