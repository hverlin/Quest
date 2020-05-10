import EventEmitter from "events";

const LAYOUTS = {
  ROWS: "rows",
  COLUMNS: "columns",
};

const LAYOUT_CLASSES = {
  [LAYOUTS.ROWS]: "row-layout",
  [LAYOUTS.COLUMNS]: "column-layout",
};

class LayoutService extends EventEmitter {
  setLayout(layout) {
    document.body.classList.remove(...Object.values(LAYOUT_CLASSES));
    this.emit("change:layout", layout);
    document.body.classList.add(LAYOUT_CLASSES[layout]);
  }

  setInitialLayout(layout) {
    document.body.classList.add(LAYOUT_CLASSES[layout]);
  }
}

const LayoutManager = new LayoutService();

export { LayoutManager, LAYOUTS };
