const FileManagerPlugin = require("filemanager-webpack-plugin");

const rules = require("./webpack.rules");

rules.push(
  {
    test: /\.(png|svg|jpg|gif)$/,
    use: ["file-loader"],
  },
  {
    test: /\.module.css$/,
    use: [
      { loader: "style-loader" },
      {
        loader: "css-loader",
        options: { modules: true },
      },
    ],
  },
  {
    test: /\.css$/,
    exclude: /\.module.css$/,
    use: [
      { loader: "style-loader" },
      {
        loader: "css-loader",
        options: { modules: false },
      },
    ],
  }
);

module.exports = {
  module: { rules },
  plugins: [
    // output file path is wrong for files that have been imported
    // using import(...) so moving them to the correct location
    new FileManagerPlugin({
      onEnd: {
        copy: [
          {
            source: ".webpack/renderer/**/*!(main_window)",
            destination: ".webpack/renderer/main_window/",
          },
        ],
      },
    }),
  ],
};
