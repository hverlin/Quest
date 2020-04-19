import React from "react";
import { Button } from "@blueprintjs/core";
import { Redirect } from "react-router-dom";

export default function ButtonLink({ children, to, ...props }) {
  const [redirect, setRedirect] = React.useState(false);

  if (redirect) {
    return <Redirect to={to} />;
  }

  return (
    <Button {...props} onClick={() => setRedirect(true)}>
      {children}
    </Button>
  );
}
