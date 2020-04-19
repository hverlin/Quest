import * as React from "react";
import log from "electron-log";
import { Callout } from "@blueprintjs/core";

export default class ErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false };
  }

  static getDerivedStateFromError() {
    return { hasError: true };
  }

  componentDidCatch(error, errorInfo) {
    log.error(error, errorInfo);
  }

  render() {
    if (this.state.hasError) {
      return <Callout intent="danger">Something went wrong.</Callout>;
    }

    return this.props.children;
  }
}
