const FileManagerPlugin = require("filemanager-webpack-plugin");

const rules = require("./webpack.rules");

rules.push({
  test: /\.css$/,
  use: [{ loader: "style-loader" }, { loader: "css-loader" }],
});

module.exports = {
  // Put your normal webpack config below here
  module: { rules },
  plugins: [
    // output file path is wrong for files that have been imported
    // using import(...) so moving them to the correct location
    new FileManagerPlugin({
      onEnd: {
        copy: [
          {
            source: ".webpack/renderer/**/*",
            destination: ".webpack/renderer/main_window/",
          },
        ],
      },
    }),
  ],
};
