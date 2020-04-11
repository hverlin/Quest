import React from "react";

export function ExternalLink({ href, children, ...props }) {
  return (
    <a
      {...props}
      href={href}
      target="_blank"
      onClick={(e) => {
        e.preventDefault();
        e.stopPropagation();
        window.open(href);
      }}
      rel="nofollow noopener"
    >
      {children}
    </a>
  );
}
