import React from "react";
import { Card } from "@blueprintjs/core";
import _ from "lodash";
import spatialNavigation from "spatial-navigation-js";

function FocusableCard({ className = "", ...props }) {
  React.useEffect(() => {
    spatialNavigation.makeFocusable();
  });

  return (
    <Card
      className={className + " focusable"}
      interactive
      tabIndex={0}
      onKeyDown={(event) => {
        if (_.isFunction(props.onClick) && event.key === "Enter") {
          event.preventDefault();
          event.stopPropagation();
          event.nativeEvent.stopImmediatePropagation();
          props.onClick();
        }
      }}
      {...props}
    />
  );
}

export default FocusableCard;
