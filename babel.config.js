let config = {
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
    ]
  ]
};

if (process.env.NODE_ENV === "production") {
  config.plugins.push(["transform-remove-console"]);
}

module.exports = config;
