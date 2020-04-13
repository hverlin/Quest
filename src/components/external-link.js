import React from "react";

export function ExternalLink({ href, children, ...props }) {
  return (
    <a
      {...props}
      href={href}
      target="_blank"
      rel="noreferrer noopener"
      onClick={(e) => {
        e.preventDefault();
        e.stopPropagation();
        window.open(href);
      }}
    >
      {children}
    </a>
  );
}
