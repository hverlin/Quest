import React, { useRef } from "react";
import { useDrag, useDrop } from "react-dnd";
import { H5, Icon } from "@blueprintjs/core";
import { CARD, ELEVATION_2 } from "@blueprintjs/core/lib/esm/common/classes";

// https://react-dnd.github.io/react-dnd/examples/sortable/simple
function SortableItem({ id, text, index, moveCard }) {
  const ref = useRef(null);
  const [, drop] = useDrop({
    accept: "item",
    hover(item, monitor) {
      if (!ref.current) {
        return;
      }
      const dragIndex = item.index;
      const hoverIndex = index;
      // Don't replace items with themselves
      if (dragIndex === hoverIndex) {
        return;
      }

      const hoverBoundingRect = ref.current.getBoundingClientRect();
      const hoverMiddleY = (hoverBoundingRect.bottom - hoverBoundingRect.top) / 2;
      const clientOffset = monitor.getClientOffset();
      const hoverClientY = clientOffset.y - hoverBoundingRect.top;

      if (dragIndex < hoverIndex && hoverClientY < hoverMiddleY) {
        return;
      }

      // Dragging upwards
      if (dragIndex > hoverIndex && hoverClientY > hoverMiddleY) {
        return;
      }
      moveCard(dragIndex, hoverIndex);
      item.index = hoverIndex;
    },
  });

  const [{ isDragging }, drag] = useDrag({
    item: { type: "item", id, index },
    collect: (monitor) => ({ isDragging: monitor.isDragging() }),
  });

  const opacity = isDragging ? 0.2 : 1;

  drag(drop(ref));
  return (
    <div
      className={`${CARD} ${ELEVATION_2}`}
      ref={ref}
      style={{ opacity, margin: "8px 0px", cursor: "move" }}
    >
      <Icon icon="drag-handle-vertical" />
      <H5 style={{ display: "inline" }}>{text}</H5>
    </div>
  );
}

export default SortableItem;
