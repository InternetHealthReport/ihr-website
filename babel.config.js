let config = {
  presets: [['@vue/app', { useBuiltIns: 'entry' }], ['@babel/preset-env']],
  plugins: [
    [
      'transform-imports',
      {
        quasar: {
          transform: 'quasar/dist/babel-transforms/imports.js',
          preventFullImport: true,
        },
      },
    ],
  ],
}

if (process.env.NODE_ENV === 'production') {
  config.plugins.push(['transform-remove-console'])
}

module.exports = config
