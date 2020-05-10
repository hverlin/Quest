import EventEmitter from "events";

const DISPOSITION = {
  ROWS: "rows",
  COLUMNS: "columns",
};

const DISPOSITION_CLASSES = {
  [DISPOSITION.ROWS]: "disposition-rows",
  [DISPOSITION.COLUMNS]: "disposition-columns",
};

class DispositionService extends EventEmitter {
  setDisposition(disposition) {
    document.body.classList.remove(...Object.values(DISPOSITION_CLASSES));
    this.emit("change:disposition", disposition);
    document.body.classList.add(DISPOSITION_CLASSES[disposition]);
  }

  setInitialDisposition(disposition) {
    document.body.classList.add(DISPOSITION_CLASSES[disposition]);
  }
}

const DispositionManager = new DispositionService();

export { DispositionManager, DISPOSITION };
