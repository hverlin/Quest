import domPurify from "dompurify";
import React from "react";

domPurify.addHook("afterSanitizeAttributes", (node) => {
  if ("target" in node) {
    node.setAttribute("target", "_blank");
  }
});

export default function SafeHtmlElement({ html, tag = "div", ...props }) {
  const TagName = tag;

  return (
    <TagName
      {...props}
      dangerouslySetInnerHTML={{
        __html: domPurify.sanitize(html, { ALLOW_UNKNOWN_PROTOCOLS: true }),
      }}
    />
  );
}
