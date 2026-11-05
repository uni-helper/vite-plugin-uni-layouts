import antfu from '@antfu/eslint-config'

export default antfu({
  type: 'lib',
  ignores: ['test/fixtures/**'],
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
