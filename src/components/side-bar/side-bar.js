import _ from "lodash";
import React from "react";
import { DraggableCore } from "react-draggable";
import style from "./side-bar.module.css";

function computeInitializeSize({ minInitialSize = 400, maxInitialSize = 840 } = {}) {
  const halfScreenSize = window.innerWidth / 2;

  return halfScreenSize < minInitialSize
    ? minInitialSize
    : halfScreenSize > maxInitialSize
    ? maxInitialSize
    : halfScreenSize;
}

export default function ResizePanel({ children }) {
  const [size, setSize] = React.useState(computeInitializeSize());
  const contentRef = React.useRef();
  const wrapperRef = React.useRef();

  function _validateSize() {
    const content = contentRef.current;
    const wrapper = wrapperRef.current;
    const actualContent = content.children[0];
    const containerParent = wrapper.parentElement;

    let minSize = actualContent.scrollWidth;
    const margins = actualContent.offsetWidth - actualContent.offsetWidth;
    minSize += margins;

    if (size !== minSize) {
      setSize(size);
      return;
    }

    const overflow = containerParent.scrollWidth - containerParent.clientWidth;
    if (overflow) {
      setSize(actualContent.clientWidth - overflow);
    }
  }

  const validateSize = _.debounce(_validateSize, 100);

  React.useEffect(() => {
    validateSize();
  }, []);

  const dragHandlers = {
    onDrag: (e, ui) => setSize(Math.max(10, size - ui.deltaX)),
    onStop: () => validateSize(),
  };

  const containerClass = style.ContainerHorizontal;

  const containerStyle = {};
  if (size !== 0) {
    containerStyle.flexGrow = 0;
    containerStyle["width"] = "auto";
  }

  const handleClasses = style.ResizeHandleHorizontal;
  const resizeBarClasses = style.ResizeBarHorizontal;
  const contentStyle = { width: `${size}px` };

  const content = [
    <div
      key="content"
      ref={contentRef}
      className={style.ResizeContentHorizontal}
      style={contentStyle}
    >
      {React.Children.only(children)}
    </div>,
  ];

  const handle = (
    <DraggableCore key="handle" {...dragHandlers}>
      <div className={resizeBarClasses}>
        <div className={handleClasses} />
      </div>
    </DraggableCore>
  );

  content.unshift(handle);

  return (
    <div ref={wrapperRef} className={containerClass} style={containerStyle}>
      {content}
    </div>
  );
}
