import React from "react";
import { Button, Icon, InputGroup, Tooltip } from "@blueprintjs/core";
import { Link } from "react-router-dom";
import styles from './search-bar.module.css'

export function SearchForm({onSubmit}) {
  const [input, setInput] = React.useState("");

  function _onSubmit(e) {
    e.preventDefault();
    onSubmit(input);
  }

  const searchButton = (
    <Tooltip content="Hit Enter to search">
      <Button icon="key-enter" minimal={true} onClick={_onSubmit}/>
    </Tooltip>
  );

  return (
    <div className={styles.searchForm}>
      <form onSubmit={_onSubmit} style={{display: 'flex'}}>
        <InputGroup
          autoFocus
          large
          placeholder="Search something..."
          value={input}
          onChange={(e) => setInput(e.target.value)}
          type="text"
          rightElement={searchButton}
        />
        <Link to="/settings" className={styles.settings}>
          <Tooltip content="Settings">
            <Icon icon='settings'/>
          </Tooltip>
        </Link>
      </form>
    </div>
  );
}
