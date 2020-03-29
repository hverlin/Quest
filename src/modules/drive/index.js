import React from "react";
import _ from "lodash";
import { loadGoogleDriveClient } from "./auth";

export function DriveSearchResults({ searchData = {} }) {
  const [isSignedIn, setIsSignedIn] = React.useState(false);
  const [error, setError] = React.useState(null);
  const [data, setData] = React.useState(null);

  React.useEffect(() => {
    if (window?.gapi?.auth2?.getAuthInstance()?.isSignedIn?.get()) {
      setIsSignedIn(true);
    } else {
      loadGoogleDriveClient(setIsSignedIn);
    }
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
          fields: "nextPageToken, files(id, name)",
        });
        setData(response);
      } catch (e) {
        setError(e);
      }
    }
    listFiles();
  }, [searchData, isSignedIn]);

  if (error) return <div>Failed to load</div>;
  if (!data) return <div>Loading Google Drive results...</div>;
  return (
    <ul>
      {_.take(data?.result?.files, 5).map(({ name, id }) => (
        <li key={id}>{name}</li>
      ))}
    </ul>
  );
}
