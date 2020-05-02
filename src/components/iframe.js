import React, { useState } from "react";
import { createPortal } from "react-dom";

export default function IFrame({ children, ...props }) {
  const [contentRef, setContentRef] = useState(null);
  const mountNode = contentRef && contentRef.contentWindow.document.body;

  return (
    <iframe {...props} ref={setContentRef}>
      {mountNode && createPortal(React.Children.only(children), mountNode)}
    </iframe>
  );
}
