import React from "react";
import _ from "lodash";
import { loadGoogleDriveClient } from "./auth";
import { Link } from "react-router-dom";
import styles from "../../components/search-results.module.css";
import { Card } from "@blueprintjs/core";
import { Time } from "../../components/time";

export default function DriveSearchResults({ searchData = {}, configuration }) {
  const [isSignedIn, setIsSignedIn] = React.useState(null);
  const [error, setError] = React.useState(null);
  const [data, setData] = React.useState(null);

  React.useEffect(() => {
    loadGoogleDriveClient(configuration, setIsSignedIn, {
      logInIfUnauthorized: false,
    });
  }, [isSignedIn]);

  React.useEffect(() => {
    async function listFiles() {
      if (!isSignedIn) {
        return;
      }

      try {
        const response = await window.gapi.client.drive.files.list({
          q: `name contains '${searchData.input}'`,
          pageSize: 5,
          fields: "nextPageToken, files(id, name, iconLink, modifiedTime)",
        });
        setData(response);
      } catch (e) {
        console.error(e);
        if (e?.status === 401) {
          configuration.nested.accessToken.set(null);
          await loadGoogleDriveClient(configuration, setIsSignedIn);
          return listFiles();
        }
        setError(e);
      }
    }
    listFiles();
  }, [searchData, isSignedIn]);

  if (isSignedIn === false) {
    return (
      <div>
        Not authenticated. Go to the <Link to="/settings">settings</Link> to
        setup the Google Drive module.
      </div>
    );
  }

  if (error) {
    return <div>Failed to load {JSON.stringify(error)}</div>;
  }

  if (!data) {
    return <div>Loading Google Drive results...</div>;
  }

  return (
    <div className={styles.results}>
      {_.take(data?.result?.files, 5).map(
        ({ name, id, iconLink, modifiedTime }) => (
          <Card interactive key={id}>
            <p>
              <img src={iconLink} />
              {"  "}
              {name}
            </p>
            <p>
              Last updated <Time time={modifiedTime} />
            </p>
          </Card>
        )
      )}
    </div>
  );
}
