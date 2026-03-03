import antfu from '@antfu/eslint-config';

export default antfu({
  formatters: true,
  unocss: true,
  vue: true,
  stylistic: {
    semi: true,
    quotes: 'single',
    indent: 2,
  },
  rules: {
    'no-console': 'off', // Allow console.log for debugging
  },
  typescript: {
    overrides: {
      // 'vue/component-definition-name-casing': ['error', 'kebab-case'],
    },
  },
});
