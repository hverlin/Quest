import _ from "lodash";
import useSWR from "swr";
import React from "react";
import { Time } from "../../components/time";
import { PaginatedSearchResults } from "../../components/search-results";
import { ExternalLink } from "../../components/external-link";
import logo from "./logo.png";
import { Card, Classes, H3, H4, Spinner } from "@blueprintjs/core";
import styles from "./redmine.module.css";
import log from "electron-log";
import qs from "qs";
import ReactMarkdown from "react-markdown";

const redmineFetcher = ({ apiKey }) => async (url) => {
  const res = await fetch(url, {
    credentials: "omit",
    headers: {
      "X-Redmine-API-Key": apiKey,
      Content: "application/json",
      Origin: url,
    },
  });
  return res.json();
};

function RedmineDetailIssue({ apiKey, baseUrl, item }) {
  const { data, error } = useSWR(
    `${item.url}.json?include=attachments,journals`,
    redmineFetcher({ apiKey, baseUrl })
  );

  if (error) {
    log.error(error);
    return <p>Failed to load issue {item.id}</p>;
  }

  if (!data) {
    return <Spinner />;
  }

  const {
    issue: {
      id,
      subject,
      status,
      tracker,
      created_on,
      updated_on,
      assigned_to,
      author,
      description,
      project,
      category,
      journals,
      attachments,
    } = {},
  } = data;

  return (
    <div>
      <div>
        <H3>
          <ExternalLink href={item.url}>
            #{id}
          </ExternalLink>{" "}
          - {subject}
        </H3>
      </div>
      <p>
        {tracker?.name} | {status?.name} |{" "}
        {project && (
          <>
            Project:{" "}
            <ExternalLink href={`${baseUrl}/projects/${project?.id}`}>
              {project?.name}
            </ExternalLink>{" "}
            |{" "}
          </>
        )}
        Created: <Time iso={created_on} /> | Updated: <Time iso={updated_on} /> |{" "}
        {assigned_to && (
          <>
            Assigned to:{" "}
            <ExternalLink href={`${baseUrl}/users/${assigned_to?.id}`}>
              {assigned_to?.name}
            </ExternalLink>{" "}
            |{" "}
          </>
        )}
        {author && (
          <>
            Reported by:{" "}
            <ExternalLink href={`${baseUrl}/users/${author?.id}`}>
              {author?.name}
            </ExternalLink>{" "}
            |{" "}
          </>
        )}
        {category && (
          <>
            Category:{" "}
            <ExternalLink href={`${baseUrl}/issue_categories/${category?.id}`}>
              {category?.name}
            </ExternalLink>
          </>
        )}
      </p>
      {description && (
        <div className={Classes.RUNNING_TEXT}>
          <hr />
          <H4>Description</H4>
          <ReactMarkdown source={description} escapeHtml={false} />
        </div>
      )}
      {!_.isEmpty(attachments) && (
        <>
          <hr />
          <div className={styles.extra}>
            <H4>Attachments</H4>
            {attachments?.map((attachment) => (
              <Card key={attachment.id} className={Classes.RUNNING_TEXT}>
                <ExternalLink href={attachment?.content_url}>
                  <b>{attachment?.filename}</b>
                </ExternalLink>
                <br />
                <ExternalLink href={`${baseUrl}/users/${attachment?.author?.id}`}>
                  {attachment?.author?.name}
                </ExternalLink>{" "}
                - <Time iso={attachment.created_on} />
              </Card>
            ))}
          </div>
        </>
      )}
      {!_.isEmpty(journals) && (
        <>
          <hr />
          <div className={styles.extra}>
            <H4>Comments</H4>
            {journals
              ?.filter((journal) => journal.notes)
              .map((journal) => (
                <Card key={journal.id} className={Classes.RUNNING_TEXT}>
                  <b>{journal.user.name}</b> - <Time iso={journal.created_on} />
                  <ReactMarkdown
                    style={{ marginTop: 3 }}
                    source={journal.notes}
                    escapeHtml={false}
                  />
                </Card>
              ))}
          </div>
        </>
      )}
    </div>
  );
}

function RedmineDetailWiki({ apiKey, baseUrl, item }) {
  const { data, error } = useSWR(`${item.url}.json`, redmineFetcher({ apiKey, baseUrl }));

  if (error) {
    log.error(error);
    return <p>Failed to load wiki {item.id}</p>;
  }

  if (!data) {
    return <Spinner />;
  }

  const { wiki_page: { title, created_on, updated_on, version, author, text } = {} } = data;

  return (
    <div>
      <div>
        <H3>
          <ExternalLink href={item.url}>
            {title}
          </ExternalLink>
        </H3>
      </div>
      <p>
        Created: <Time iso={created_on} /> | Updated: <Time iso={updated_on} /> | Version: {version}{" "}
        |{" "}
        {author && (
          <>
            Last edited by:{" "}
            <ExternalLink href={`${baseUrl}/users/${author?.id}`}>
              {author?.name}
            </ExternalLink>
          </>
        )}
      </p>
      {text && (
        <div className={Classes.RUNNING_TEXT}>
          <hr />
          <ReactMarkdown source={text} escapeHtml={false} />
        </div>
      )}
    </div>
  );
}

function RedmineDetailDefault({ item }) {
  const { title, url, description, datetime } = item;

  return (
    <div>
      <div>
        <H3>
          <ExternalLink href={url}>
            {title}
          </ExternalLink>
        </H3>
      </div>
      <p>
        Created: <Time iso={datetime} />
      </p>
      <div className={Classes.RUNNING_TEXT}>
        <hr />
        <ReactMarkdown source={description} escapeHtml={false} />
      </div>
    </div>
  );
}

const redmineDetailComponents = {
  "issue-closed": RedmineDetailIssue,
  issue: RedmineDetailIssue,
  "wiki-page": RedmineDetailWiki,
};

function RedmineDetail({ item, apiKey, url }) {
  let Component = RedmineDetailDefault;
  if (item && item.type && redmineDetailComponents[item.type]) {
    Component = redmineDetailComponents[item.type];
  }
  return <Component apiKey={apiKey} baseUrl={url} item={item} />;
}

function RedmineResultItem({ item = {} }) {
  const { url, title, datetime } = item;

  return (
    <>
      <p>
        <ExternalLink href={url}>
          {title}
        </ExternalLink>
      </p>
      <p>
        Updated: <Time iso={datetime} />
      </p>
    </>
  );
}

function getRedminePage(url, searchData, apiKey, pageSize = 5) {
  return (wrapper) => ({ offset = 0, withSWR }) => {
    const searchParams = qs.stringify({
      offset: offset || 0,
      limit: pageSize,
    });

    const { data, error } = withSWR(
      useSWR(
        () => (url ? `${url}/search.json?${searchParams}&q="${searchData.input}"` : null),
        redmineFetcher({ apiKey, baseUrl: url })
      )
    );

    if (error) {
      return wrapper({ error, item: null });
    }

    if (!data) {
      return wrapper({ item: null });
    }

    return data?.results.map((item) =>
      wrapper({
        key: item.id,
        component: <RedmineResultItem key={item.id} item={item} />,
        item,
      })
    );
  };
}

export default function JiraSearchResults({ configuration, searchViewState }) {
  const searchData = searchViewState.get();
  const { apiKey, url, pageSize } = configuration.get();

  return (
    <PaginatedSearchResults
      searchViewState={searchViewState}
      logo={logo}
      error={!url ? "Redmine module is not configured correctly. URL is missing." : null}
      configuration={configuration}
      computeNextOffset={({ data }) =>
        data?.total_count > data?.offset + pageSize ? data.offset + pageSize : null
      }
      itemDetailRenderer={(item) => <RedmineDetail apiKey={apiKey} item={item} url={url} />}
      pageFunc={getRedminePage(url, searchData, apiKey, pageSize)}
      getTotal={(pageSWRs) => _.get(pageSWRs, ["0", "data", "total_count"], null)}
    />
  );
}
