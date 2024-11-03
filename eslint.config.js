import globals from "globals"
import pluginJs from "@eslint/js"
import tseslint from "typescript-eslint"
import pluginVue from "eslint-plugin-vue"


/** @type {import('eslint').Linter.Config[]} */
export default [
  {files: ["**/*.{js,mjs,cjs,ts,vue}"]},
  {languageOptions: { globals: globals.browser }},
  pluginJs.configs.recommended,
  ...tseslint.configs.recommended,
  ...pluginVue.configs["flat/essential"],
  {files: ["**/*.vue"], languageOptions: {parserOptions: {parser: tseslint.parser}}},
  {
    rules: {
      'vue/multi-word-component-names': [
        'error',
        {
          ignores: [
            'Btn',
            'Btn.story',
            'Field',
            'Field.story',
            'Dialog.story',
            'Dialog',
            'Switch',
            'Preloader',
            'Switch.story',
            'Icons.story',
            'Typography.story'
          ]
        }
      ],
      'vue/no-unused-vars': 'error',
      'vue/no-reserved-component-names': [
        'warn',
        {
          disallowVue3BuiltInComponents: false
        }
      ]
    }
  }
];