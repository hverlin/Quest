import React from "react";
import update from "immutability-helper";
import SortableItem from "./sortable-item";

function SortableList({ initialItems, onChange }) {
  const [items, setItems] = React.useState(initialItems);

  const moveItem = React.useCallback(
    (dragIndex, hoverIndex) => {
      const dragItem = items[dragIndex];
      const updatedItems = update(items, {
        $splice: [
          [dragIndex, 1],
          [hoverIndex, 0, dragItem],
        ],
      });
      setItems(updatedItems);
      onChange(updatedItems);
    },
    [items]
  );

  return (
    <div>
      {items.map((card, i) => (
        <SortableItem key={card.id} text={card.text} index={i} id={card.id} moveCard={moveItem} />
      ))}
    </div>
  );
}

export default SortableList;
