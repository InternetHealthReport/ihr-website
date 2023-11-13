module.exports = {
  root: true,
  env: {
    node: true,
  },
  extends: ['plugin:vue/essential'],
  rules: {
    'vue/multi-word-component-names': 0,
    'no-console': process.env.NODE_ENV === 'production' ? 'error' : 'warn',
    'no-debugger': process.env.NODE_ENV === 'production' ? 'error' : 'off',
    indent: ['error', 2, { SwitchCase: 1, ignoredNodes: ['TemplateLiteral'] }],
    quotes: ['error', 'single', { avoidEscape: true }],
  },
  parserOptions: {
    parser: 'babel-eslint',
  },
}
