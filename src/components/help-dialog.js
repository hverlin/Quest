import { Button, Classes, Dialog } from "@blueprintjs/core";
import React from "react";
import ReactMarkdown from "react-markdown";

export default function HelpDialog({ title = "help", helpText }) {
  const [isOpen, setIsOpen] = React.useState(false);

  return (
    <>
      <Button minimal icon="help" onClick={() => setIsOpen(true)}>
        Help
      </Button>
      <Dialog onClose={() => setIsOpen(false)} title={title} isOpen={isOpen}>
        <div className={Classes.DIALOG_BODY} style={{ wordBreak: "break-word" }}>
          <ReactMarkdown source={helpText} />
        </div>
        <div className={Classes.DIALOG_FOOTER}>
          <div className={Classes.DIALOG_FOOTER_ACTIONS}>
            <Button onClick={() => setIsOpen(false)}>Close</Button>
          </div>
        </div>
      </Dialog>
    </>
  );
}
