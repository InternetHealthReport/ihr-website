const path = require("path");
module.exports = {
  chainWebpack: webpackConfig => {
    webpackConfig.module
      .rule("ify-loader")
      .test(/node_module\/plotly.js\/*.js$/)
      .use("ify-loader")
      .loader("ify-loader");
  },
  pluginOptions: {
    quasar: {
      rtlSupport: true,
      treeShake: true
    },
    i18n: {
      locale: "en-us",
      fallbackLocale: "en-us",
      localeDir: "locales",
      enableInSFC: true
    }
  },
  transpileDependencies: [/[\\\/]node_modules[\\\/]quasar[\\\/]/],
  configureWebpack: {
    resolve: {
      alias: {
        "@": path.join(__dirname, "./src")
      },
      extensions: [".js", ".vue", ".json"]
    }
  }
};
