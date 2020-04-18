import React from "react";
import { Card } from "@blueprintjs/core";
import _ from "lodash";
import spatialNavigation from "spatial-navigation-js";
import Mark from "mark.js";

function FocusableCard({ className = "", ...props }) {
  const elRef = React.useRef();
  React.useEffect(() => {
    spatialNavigation.makeFocusable();
    const instance = new Mark(elRef.current);
    instance.mark("test", {
      element: "span",
    });
  });

  return (
    <div ref={elRef}>
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
    </div>
  );
}

export default FocusableCard;
