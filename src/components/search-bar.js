import React from "react";
import { Button, InputGroup, Tooltip } from "@blueprintjs/core";
import styles from "./search-bar.module.css";

export function SearchForm({ onSubmit }) {
  const [input, setInput] = React.useState("");
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

  function _onSubmit(e) {
    e.preventDefault();
    onSubmit(input);
  }

  const searchButton = (
    <Tooltip
      content={
        <span>
          Press <code>Enter</code> to search.
          <br /> Use <code>/</code> to focus the search bar
        </span>
      }
      openOnTargetFocus={false}
    >
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
      </form>
    </div>
  );
}
