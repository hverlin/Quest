import React from "react";
import Mark from "mark.js";
import _ from "lodash";

function Highlighter({ text, children }) {
  const elRef = React.useRef();
  React.useEffect(() => {
    const instance = new Mark(elRef.current);
    instance.mark(text, { element: "span" });
    const observer = new MutationObserver(
      _.debounce(() => instance.mark(text, { element: "span", exclude: ["[data-markjs]"] }), 100)
    );
    observer.observe(elRef.current, { childList: true, subtree: true });
    return () => observer.disconnect();
  });

  return <div ref={elRef}>{children}</div>;
}

export default Highlighter;
