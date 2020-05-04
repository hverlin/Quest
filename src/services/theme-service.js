import { Classes } from "@blueprintjs/core";
import { remote } from "electron";
import EventEmitter from "events";

const THEMES = {
  LIGHT: "light",
  DARK: "dark",
  SYSTEM: "system",
};

class ThemeService extends EventEmitter {
  constructor() {
    super();
    this.theme = window.process.argv.find((a) => a.startsWith("--theme")).split("=")[1];

    remote.nativeTheme.on("updated", () => this.setTheme(this.theme));
  }

  shouldUseDarkTheme() {
    return (
      this.theme === THEMES.DARK ||
      (this.theme === THEMES.SYSTEM && remote.nativeTheme.shouldUseDarkColors)
    );
  }

  setTheme(theme) {
    this.theme = theme;
    this.emit("change:theme", theme);

    if (this.shouldUseDarkTheme()) {
      document.body.classList.add(Classes.DARK);
    } else {
      document.body.classList.remove(Classes.DARK);
    }
  }

  toggleTheme() {
    if (!this.shouldUseDarkTheme()) {
      this.setTheme(THEMES.DARK);
    } else {
      this.setTheme(THEMES.LIGHT);
    }
  }

  setInitialTheme() {
    if (this.shouldUseDarkTheme()) {
      document.body.classList.add(Classes.DARK);
    }
  }
}

const ThemeManager = new ThemeService();

export { ThemeManager, THEMES };
