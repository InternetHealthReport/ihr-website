module.exports = {
  pluginOptions: {
    quasar: {
      rtlSupport: true,
      treeShake: true
    }
  },
  transpileDependencies: [/[\\\/]node_modules[\\\/]quasar[\\\/]/]
};
