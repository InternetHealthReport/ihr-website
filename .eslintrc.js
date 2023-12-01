module.exports = {
  root: true,
  env: {
    node: true,
  },
  extends: ['plugin:vue/essential'],
  rules: {
    'no-console': process.env.NODE_ENV === 'production' ? 'error' : 'warn',
    'no-debugger': process.env.NODE_ENV === 'production' ? 'error' : 'off',
    indent: ['error', 2, { SwitchCase: 1, ignoredNodes: ['TemplateLiteral'] }],
    quotes: ['error', 'single', { avoidEscape: true }],
    'vue/require-v-for-key': 'warn',
    'vue/no-use-v-if-with-v-for': 'warn',
    'vue/no-mutating-props': 'warn'
  },
  parserOptions: {
    parser: 'babel-eslint',
  },
}
