import antfu from '@antfu/eslint-config'

export default antfu({
  type: 'lib',
  // Generated declarations carry their own suppression comments; linting them
  // here only reports those comments as unused.
  ignores: ['test/fixtures/**', 'playground/src/*.d.ts'],
}, {
  files: ['test/**/*.ts'],
  rules: {
    'ts/no-require-imports': 'off',
  },
}, {
  files: ['playground/**'],
  rules: {
    'no-console': 'off',
  },
}, {
  files: ['pnpm-workspace.yaml'],
  rules: {
    'pnpm/yaml-enforce-settings': 'off',
  },
})
