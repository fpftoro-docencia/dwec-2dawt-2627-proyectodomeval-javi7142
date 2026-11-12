import js from '@eslint/js';
import globals from 'globals';

export default [
  // Lo que generan las herramientas no se revisa: documentación, web publicable e informes
  { ignores: ['docs/', 'dist/', 'coverage/', 'playwright-report/', 'test-results/'] },
  js.configs.recommended,
  {
    languageOptions: {
      ecmaVersion: 'latest',
      sourceType: 'module',
      globals: { ...globals.browser, ...globals.node },
    },
    rules: {
      'no-var': 'error',
      'prefer-const': 'error',
      eqeqeq: 'error',
      // Reglas propias del proyecto: por qué se eligió cada una, en la sección «Integración continua» del README
      camelcase: ['error', { properties: 'never' }],
      curly: ['error', 'multi-line'],
      'no-param-reassign': 'error',
      'no-else-return': 'error',
    },
  },
];
