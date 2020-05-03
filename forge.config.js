module.exports = {
  packagerConfig: {
    appBundleId: "org.quest.app",
    icon: "./src/icon.icns",
  },
  makers: [
    {
      name: "@electron-forge/maker-squirrel",
      config: {
        name: "my_search",
      },
    },
    {
      name: "@electron-forge/maker-zip",
      platforms: ["darwin"],
    },
    {
      name: "@electron-forge/maker-deb",
      config: {
        options: {
          description: "Quest is a Unified Engine for Searching Things",
          depends: ["libsecret-1-dev"],
          homepage: "https://github.com/hverlin/Quest",
        },
      },
    },
    {
      name: "@electron-forge/maker-rpm",
      config: {
        description: "Quest is a Unified Engine for Searching Things",
        requires: ["libsecret-devel"],
        homepage: "https://github.com/hverlin/Quest",
      },
    },
  ],
  plugins: [
    [
      "@electron-forge/plugin-webpack",
      {
        mainConfig: "./webpack.main.config.js",
        renderer: {
          config: "./webpack.renderer.config.js",
          entryPoints: [
            {
              html: "./src/index.html",
              js: "./src/renderer.js",
              name: "main_window",
            },
          ],
        },
      },
    ],
  ],
  publishers: [
    {
      name: "@electron-forge/publisher-github",
      config: {
        repository: { owner: "hverlin", name: "Quest" },
        prerelease: true,
      },
    },
  ],
};
