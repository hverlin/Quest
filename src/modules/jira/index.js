import useSWR from "swr";
import _ from "lodash";
import React from "react";
import { Card, Collapse } from "@blueprintjs/core";

import styles from "../../components/search-results.module.css";
import { Time } from "../../components/time";
import { SearchCard } from "../../components/search-card";

const jiraFetcher = ({ username, password }) => async (url) => {
  const res = await fetch(url, {
    credentials: "omit",
    headers: {
      Authorization: `Basic ${btoa(`${username}:${password}`)}`,
      Accept: "application/json",
    },
  });

  return res.json();
};

function resultItem(url) {
  return (issue) => {
    const {
      id,
      key,
      fields: {
        issuetype,
        summary,
        assignee,
        status,
        reporter,
        created,
        updated,
      },
    } = issue;
    return (
      <Card interactive key={id} onClick={() => window.open(url + "/browse/" + key)}>
        <p>
          <img src={issuetype?.iconUrl} alt="test" />
          {"  "}
          <a
            target="_blank"
            rel="nofollow noopener"
            href={url + "/browse/" + key}
          >
            {key}
          </a>{" "}
          - {summary}
        </p>
        <p>
          Created: <Time time={created} /> | Updated: <Time time={updated} /> |{" "}
          {assignee.displayName} | {status.name} | reported by{" "}
          {reporter.displayName}
        </p>
      </Card>
    );
  };
}

export default function JiraSearchResults({ searchData = {}, configuration }) {
  const { username, password, url } = configuration.get();
  const [showMore, setShowMore] = React.useState(false);

  const { data, error } = useSWR(
    () =>
      url ? `${url}/rest/api/2/search?jql=text+~+${searchData.input}` : null,
    jiraFetcher({ username, password })
  );

  if (!url) {
    return <div>JIRA module is not configured correctly. URL is missing.</div>;
  }

  if (error) {
    return <div>Failed to load</div>;
  }

  if (!data) {
    return <div>Loading Jira issues...</div>;
  }

  return (
    <SearchCard configuration={configuration} results={`Showing ${_.size(data.issues)} of ${data.total} results`}>
      {_.take(data.issues, 5).map(resultItem(url))}
      {!showMore && <a onClick={() => setShowMore(!showMore)}>Show more</a>}
      <Collapse isOpen={showMore}>
        <div className={styles.results}>
          {_.takeRight(data.issues, 5).map(resultItem(url))}
        </div>
      </Collapse>
      {showMore && <a onClick={() => setShowMore(!showMore)}>Show less</a>}
    </SearchCard>
  );
}
