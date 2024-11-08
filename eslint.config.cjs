
const globals = require("globals")
const pluginVue = require("eslint-plugin-vue")
const js = require("@eslint/js")


module.exports = [
  ...pluginVue.configs['flat/recommended'],
  {
    files: ["**/*.{vue,js,jsx,cjs,mjs}"],
    ignores: ["**/tests/*"],
    languageOptions: {
      ecmaVersion: 2022,
      sourceType: "module",
      globals: {
        ...globals.browser,
        ...globals.node,
        myCustomGlobal: "readonly"
      },
    },
    rules: {
       "vue/no-v-html": "off",
       "vue/multi-word-component-names": "off",
       "vue/require-prop-types": "off",
       "vue/require-default-prop": "off",
       "vue/no-template-shadow": "off",
       "vue/require-explicit-emits": "off",
       "vue/no-useless-template-attributes": "off",
       "vue/return-in-emits-validator": "off",
       "vue/no-side-effects-in-computed-properties": "off",
       "vue/no-v-text-v-html-on-component": "off",
      // ...js.configs.recommended.rules,
      
    },
  }
]
