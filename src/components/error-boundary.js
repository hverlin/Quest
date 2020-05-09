import * as React from "react";
import log from "electron-log";
import { Callout } from "@blueprintjs/core";

export default class ErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false };
  }

  static getDerivedStateFromError(error) {
    return { hasError: true, error };
  }

  componentDidCatch(error, errorInfo) {
    log.error(error, errorInfo);
  }

  render() {
    const {
      children,
      displayStacktrace = process.env.NODE_ENV !== "production",
      message = "",
    } = this.props;

    if (this.state.hasError) {
      return (
        <Callout intent="danger">
          Something went wrong.
          {message}
          {displayStacktrace && <pre>{this.state.error.stack}</pre>}
        </Callout>
      );
    }

    return children;
  }
}
