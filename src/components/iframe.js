import React, { useState } from "react";
import { createPortal } from "react-dom";

export default function IFrame({
  children,
  initialSize = 0,
  shouldExpand = true,
  style,
  ...props
}) {
  const [contentRef, setContentRef] = useState(null);
  const [iframeHeight, setIframeHeight] = useState(0);
  const mountNode = contentRef && contentRef.contentWindow.document.body;

  React.useEffect(() => {
    if (contentRef && shouldExpand) {
      setIframeHeight(contentRef.contentWindow.document.body.scrollHeight);
    } else {
      setIframeHeight(initialSize);
    }
  }, [children, contentRef]);

  return (
    <iframe
      {...props}
      sandbox=""
      ref={setContentRef}
      style={Object.assign({}, style, { height: iframeHeight })}
    >
      {mountNode && createPortal(React.Children.only(children), mountNode)}
    </iframe>
  );
}
