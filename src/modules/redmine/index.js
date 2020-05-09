import _ from "lodash";
import React from "react";
import { Time } from "../../components/time";
import { ExternalLink } from "../../components/external-link";
import logo from "./logo.png";
import { Card, Classes, H3, H4, Spinner } from "@blueprintjs/core";
import styles from "./redmine.module.css";
import log from "electron-log";
import qs from "qs";
import ReactMarkdown from "react-markdown";
import { PaginatedResults } from "../../components/paginated-results/paginated-results";
import { useQuery } from "react-query";

const redmineFetcher = ({ baseUrl, apiKey }) => async (url) => {
  let res = await fetch(url, {
    credentials: "omit",
    headers: {
      "X-Redmine-API-Key": apiKey,
      "Content-Type": "application/json",
      Origin: baseUrl,
    },
  });

  if (res.redirected) {
    const redirectedUrl = res.url;
    res = await fetch(`${res.url}.json`, {
      credentials: "omit",
      headers: {
        "X-Redmine-API-Key": apiKey,
        "Content-Type": "application/json",
        Origin: baseUrl,
      },
    });
    return { response: await res.json(), redirected: true, redirectedUrl };
  }

  return { response: await res.json() };
};

function RedmineDetailIssue({ apiKey, baseUrl, item }) {
  const { data, error } = useQuery(
    `${item.url}.json?include=attachments,journals`,
    redmineFetcher({ baseUrl, apiKey })
  );

  if (error) {
    log.error(error);
    return <p>Failed to load issue {item.id}</p>;
  }

  if (!data || !data.response) {
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
  } = data.response;

  return (
    <div>
      <div>
        <H3>
          <ExternalLink href={item.url}>#{id}</ExternalLink> - {subject}
        </H3>
      </div>
      <p>
        {tracker?.name} | {status?.name} |{" "}
        {project && (
          <>
            Project:{" "}
            <ExternalLink href={`${baseUrl}/projects/${project?.id}`}>{project?.name}</ExternalLink>{" "}
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
            <ExternalLink href={`${baseUrl}/users/${author?.id}`}>{author?.name}</ExternalLink> |{" "}
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
  const { data, error } = useQuery(`${item.url}.json`, redmineFetcher({ apiKey, baseUrl }));

  if (error) {
    log.error(error);
    return <p>Failed to load wiki {item.id}</p>;
  }

  if (!data || !data.response) {
    return <Spinner />;
  }

  const {
    wiki_page: { title, created_on, updated_on, version, author, text } = {},
  } = data.response;

  return (
    <div>
      <div>
        <H3>
          <ExternalLink href={item.url}>{title}</ExternalLink>
        </H3>
      </div>
      <p>
        Created: <Time iso={created_on} /> | Updated: <Time iso={updated_on} /> | Version: {version}{" "}
        |{" "}
        {author && (
          <>
            Last edited by:{" "}
            <ExternalLink href={`${baseUrl}/users/${author?.id}`}>{author?.name}</ExternalLink>
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
          <ExternalLink href={url}>{title}</ExternalLink>
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
        <ExternalLink href={url}>{title}</ExternalLink>
      </p>
      <p>
        Updated: <Time iso={datetime} />
      </p>
    </>
  );
}

function RedmineIssuesItem({ issue = {}, url }) {
  const { id, subject, created_on, updated_on, tracker } = issue;

  return (
    <>
      <p>
        <ExternalLink href={url}>
          {tracker?.name} #{id} - {subject}
        </ExternalLink>
      </p>
      <p>
        Created: <Time iso={created_on} /> | Updated: <Time iso={updated_on} />
      </p>
    </>
  );
}

async function redmineResultsFetcher(key, { input, apiKey, baseUrl, pageSize }, offset = 0) {
  const searchParams = qs.stringify({
    offset,
    limit: pageSize,
  });

  return redmineFetcher({ baseUrl, apiKey })(`${baseUrl}/search.json?${searchParams}&q=${input}`);
}

function makeRedmineRenderer({ pages }) {
  return _.flatten(
    pages.map(({ response, redirected = false, redirectedUrl = null }) => {
      if (redirected && response.issue) {
        const issue = response.issue;
        return [
          {
            key: "issue-" + issue.id,
            component: <RedmineIssuesItem key={issue.id} issue={issue} url={redirectedUrl} />,
            item: {
              ...issue,
              type: "issue",
              url: redirectedUrl,
            },
          },
        ];
      }

      if (!response.results) {
        return [];
      }

      return response?.results.map((item) => ({
        key: item.id,
        component: <RedmineResultItem key={item.id} item={item} />,
        item,
      }));
    })
  );
}

export default function RedmineSearchResults({ configuration, searchViewState }) {
  const searchData = searchViewState.get();
  const { apiKey, url, pageSize } = configuration.get();

  return (
    <PaginatedResults
      queryKey={[
        "redmine",
        {
          input: searchData.input,
          apiKey,
          baseUrl: url,
          pageSize,
        },
      ]}
      searchViewState={searchViewState}
      logo={logo}
      globalError={!url ? "Redmine module is not configured correctly. URL is missing." : null}
      configuration={configuration}
      getFetchMore={({ response }) =>
        response?.total_count > response?.offset + pageSize ? response.offset + pageSize : null
      }
      fetcher={redmineResultsFetcher}
      itemDetailRenderer={(item) => <RedmineDetail apiKey={apiKey} item={item} url={url} />}
      renderPages={makeRedmineRenderer}
      getTotal={(pages) => (pages?.[0]?.response?.issue ? 1 : pages?.[0]?.response?.total_count)}
    />
  );
}
