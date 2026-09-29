// @ts-check
const { defineConfig } = require('eslint/config')
const expoConfig = require('eslint-config-expo/flat')
const prettier = require('eslint-config-prettier')
const boundaries = require('eslint-plugin-boundaries')

/** Same feature as the importing file; `files` narrows which of its files (relative to the feature). */
const sameFeature = (files = '**') => ({
  element: {
    type: 'feature',
    captured: { feature: '{{ from.element.captured.feature }}' },
    fileInternalPath: files,
  },
})

// Module boundaries (docs/adr/0001-estrutura-por-feature.md, 0002-mock-backend-compartilhado.md).
module.exports = defineConfig([
  { ignores: ['dist/', '.expo/', 'coverage/', 'expo-env.d.ts'] },
  expoConfig,
  prettier,
  {
    files: ['src/**/*.{ts,tsx}'],
    plugins: { boundaries },
    settings: {
      'import/resolver': { typescript: { alwaysTryTypes: true } },
      'boundaries/legacy-templates': false,
      'boundaries/elements': [
        { type: 'feature-test', pattern: 'src/features/*/__tests__', capture: ['feature'] },
        { type: 'test', pattern: 'src/**/__tests__' },
        { type: 'app', pattern: 'src/app' },
        { type: 'feature', pattern: 'src/features/*', capture: ['feature'] },
        { type: 'mock-backend', pattern: 'src/shared/mock-backend' },
        { type: 'shared', pattern: 'src/shared' },
      ],
    },
    rules: {
      'boundaries/no-unknown-files': 'error',
      'boundaries/dependencies': [
        'error',
        {
          default: 'disallow',
          // Also check imports inside a feature, so only its api.ts reaches its mock.
          checkInternals: true,
          policies: [
            { allow: { to: { module: { origin: ['external', 'core'] } } } },
            // Tests reach shared/ (the mock backend too) and, in a feature, that feature's files
            // including its mock.
            {
              from: { element: { type: ['feature-test', 'test'] } },
              allow: { to: { element: { type: ['shared', 'mock-backend', 'test'] } } },
            },
            {
              from: { element: { type: 'feature-test' } },
              allow: {
                to: {
                  element: {
                    type: ['feature', 'feature-test'],
                    captured: { feature: '{{ from.element.captured.feature }}' },
                  },
                },
              },
            },
            {
              from: { element: { type: 'app' } },
              allow: { to: [{ element: { type: ['app', 'shared'] } }, sameFeatureAny()] },
            },
            // A feature reaches its own files and shared/; its mock only through its api.ts.
            {
              from: { element: { type: 'feature' } },
              allow: { to: [sameFeature('!mock.ts'), { element: { type: 'shared' } }] },
            },
            {
              from: { element: { type: 'feature', fileInternalPath: 'api.ts' } },
              allow: { to: sameFeature('mock.ts') },
            },
            // The shared mock backend is reached only by features' mock.ts files (and tests).
            {
              from: { element: { type: 'feature', fileInternalPath: 'mock.ts' } },
              allow: { to: { element: { type: 'mock-backend' } } },
            },
            {
              from: { element: { type: ['shared', 'mock-backend'] } },
              allow: { to: { element: { type: 'shared' } } },
            },
            {
              from: { element: { type: 'mock-backend' } },
              allow: { to: { element: { type: 'mock-backend' } } },
            },
          ],
        },
      ],
    },
  },
])

/** Any feature except its mock (routes compose features). */
function sameFeatureAny() {
  return { element: { type: 'feature', fileInternalPath: '!mock.ts' } }
}
