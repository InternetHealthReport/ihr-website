const removeConsolePlugin = [];
if (process.env.NODE_ENV === "production") {
  removeConsolePlugin.push("transform-remove-console");
}

module.exports = {
  presets: ["@vue/app"],
  plugins: [
    [
      "transform-imports",
      {
        quasar: {
          transform: "quasar/dist/babel-transforms/imports.js",
          preventFullImport: true
        }
      }
    ],
    removeConsolePlugin
  ]
};
