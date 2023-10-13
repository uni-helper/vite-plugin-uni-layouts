import { defineBuildConfig } from 'unbuild'

export default defineBuildConfig({
  entries: ['src/index'],
  declaration: true,
  clean: true,
  rollup: {
    emitCJS: true,
  },
  failOnWarn: false,
  externals: ['vite', 'vue'],
  hooks: {
    'build:before': function (ctx) {
      ctx.options.externals = ctx.options.externals.filter(
        v => v !== 'estree-walker',
      )
    },
  },
})
