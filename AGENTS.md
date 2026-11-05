# vite-plugin-uni-layouts

在 Vite 驱动的 uni-app 中提供布局框架：构建期扫描 `src/layouts` 生成虚拟模块 `virtual:uni-layouts` 并全局注册布局组件，transform 阶段按 pages.json 的 `layout` 字段把页面模板包进对应布局组件。无 CLAUDE.md；playground 是本仓库唯一的 workspace 成员，没有独立 AGENTS.md（差异点在下方架构与约定）。

## 项目

- TypeScript，`strict: true`（tsconfig.json 只排除 `playground/**`）；`"type": "module"`，产物只有 ESM：`dist/index.mjs` 和 `dist/index.d.mts`，入口只有 `src/index.ts`。`exports` 里没有 `require` 条件，`main` 也指向 `.mjs`。
- 构建用 tsdown（`tsdown.config.ts`：`format: 'esm'`、`dts: true`、`clean: true`）。`vite` 是 devDependency 且列在 `deps.neverBundle`，其余依赖保持外部 import，不打进产物。发布内容是 `dist` 加根级 `client.d.ts`（经 `exports["./client"]` 提供）。
- Node：`.node-version` 是 26，`devEngines.runtime` 26（`onFail: warn`），`engines` 允许 `^22.22.2 || ^24.15.0 || >=26.0.0`。包管理器 pnpm 12.16.1（`packageManager` + `devEngines`）。workspace 只含 `playground`。
- 版本统一写在 `pnpm-workspace.yaml` 的 `catalog`，`package.json` 一律用 `catalog:` 引用。`pnpm install` 前会按 `trustPolicy: no-downgrade` 校验锁文件，`trustPolicyExclude` 里放了三个被 `.dcloudio` 锁住的老版本（`vite@5.4.21`、`semver@6.3.1`、`@vitejs/plugin-legacy@5.3.2`），去掉它们会让安装直接失败。
- 依赖：tinyglobby（扫布局）、scule（大小写推导）、`@vue/compiler-core` + `@vue/compiler-sfc`（catalog 钉 `~3.4.38`，解析模板用）、@babel/types、ast-kit、magic-string 1.x、jsonc-parser、chokidar 3.6.0（catalog 精确钉住，3.x 的 `FSWatcher` 类型和 Vite 5 的 watcher 对得上）、@uni-helper/uni-env。
- 开发依赖：vite 5、vitest 3、typescript 6、tsdown、@antfu/eslint-config 10、vue（playground 与类型用）。
- 测试：vitest，无配置文件，测试在根 `test/`，直接 import `src/`，快照断言；fixtures 在 `test/fixtures`（PascalCase / camelCase / kebab-case / 嵌套 / no-index 布局 + pages.json）。`test/fixtures` 在 eslint 里整体忽略。
- CI：`.github/workflows/ci.yml`，Linux / macOS / Windows × Node 22 / 24 / 26，依次跑 build、lint、test、typecheck。发布走 `pnpm release`（bumpp）→ `v*` tag → `release.yml`（changelogithub + `pnpm publish`）。

## 命令

```bash
pnpm install                 # 安装依赖
pnpm dev                     # tsdown --watch，改 src 后 playground 直接生效
pnpm build                   # 构建到 dist/（只有 ESM + dts）
pnpm typecheck               # tsc --noEmit，不含 playground
pnpm test                    # vitest watch 模式；单次运行用 pnpm exec vitest run
pnpm lint                    # eslint 检查
pnpm lint:fix                # eslint 自动修复
pnpm dev:play:h5             # pnpm -C playground run dev:h5
pnpm dev:play:mp-weixin      # pnpm -C playground run dev:mp-weixin
pnpm build:play:h5           # 构建 playground 的 H5 产物
pnpm build:play:mp-weixin    # 构建 playground 的小程序产物
pnpm release                 # 维护者发布：bumpp
```

playground 自己的类型检查在 `playground` 目录下跑 `pnpm typecheck`（`vue-tsc --noEmit`）。

## 架构

| 模块 | 职责 |
| --- | --- |
| `src/index.ts` | 插件入口：`enforce: 'pre'`；`configResolved` 里 `build.watch` 时用 chokidar 监听 `src/pages.json` 和 `pages.json`；`configureServer` 接 Vite 的 watcher；`resolveId` / `load` 提供虚拟模块；`transform` 先匹配 `src/main.(ts\|js)` / `main.(ts\|js)` 注入布局注册，其余交给 `ctx.transform` |
| `src/context.ts` | Context 类：页面 transform、`<uni-layout>` 动态布局改写、`importLayoutComponents`（main 注入）、`virtualModule` 代码生成 |
| `src/scan.ts` | `scanLayouts`：tinyglobby 扫 `layoutDir` 下 `**/*.vue`（忽略 `**/__*__/*`），结果排序，推导 name / pascalName / kebabName |
| `src/utils.ts` | `resolveOptions` / `getPageJsonPath` / `loadPagesJson`（jsonc 解析，合并 subPackages）/ `getTarget` / `parseSFC`（兼容 compiler-sfc 2.7 的返回形状） |
| `src/types.ts` | `Options`（layout / layoutDir / cwd）、`Layout`、`Page` |
| `src/constant.ts` | `virtualModuleId = 'virtual:uni-layouts'` |
| `client.d.ts` | `virtual:uni-layouts` 声明：`layouts` 组件记录 + 默认导出 Vue Plugin |
| `test/` | vitest 快照测试 + fixtures |

关键行为：

- **布局名推导**（scan.ts）：文件名为 `index` 时取父目录名；目录段逐段与文件名段比对（scule `splitByCase`，大小写不敏感），相同的段及之后丢弃，剩余目录段 + 文件名段拼出 pascalName，`name` 是 camelCase，注册的组件名是 `layout-{kebabName}-uni`。页面配置里写的是 `name`（camelCase）。
- **页面匹配**（utils.ts `getTarget`）：只处理 `.vue` / `.nvue`；路径在 `src/` 下则相对 `src` 解析，去扩展名后与 pages.json 的 `path`（含 subPackages 的 `root` 前缀）比对。uni-pages 0.6 生成的分包条目正好是 `root` + 页面相对分包的 `path`，拼起来等于源码相对 `src` 的位置。
- **layout 字段语义**（context.ts）：缺省或 `true` → 用选项 `layout`（默认 `default`）；`false` → 禁用静态布局，走 `<uni-layout>` 动态分支；字符串找不到对应布局或为空串 → 原样返回，不报错也不警告。
- **模板改写**：非禁用页面把整个 `<template>` 内容包进 `<layout-{kebabName}-uni>`；script setup 里声明 `const uniLayout = ref()` 时自动加 `ref="uniLayout"`。`<uni-layout>` 动态分支按平台分叉：小程序端展开成每个布局的 `v-if` / `v-else-if` 链（条件是 name 绑定表达式 `=== '{kebabName}'`），H5 端生成 `<component is="layout-{name}-uni">`。
- **main 注入很脆**（context.ts `importLayoutComponents`）：用正则 `/(createApp[\s\S]*?)(return\s\{\s*app)/` 往 createApp 调用里插 `app.component(...)`，依赖 main 文件的书写形状；全局注册还有 `virtual:uni-layouts` 一条路（默认导出的 install 插件逐个 `app.component`）。
- **HMR 不完整**：watcher 只在 pages.json change 时重载 pages，布局文件的增删改没有 watch（context.ts 有 `// TODO: auto reload`），改布局后通常要重启 dev server 才生效。
- **`uni-layout` 标签别留在静态布局的页面里**：页面没有写 `layout: false` 却带着 `<uni-layout>` 时，模板被包进布局组件后 uni-app 的编译器会抛 `Cannot read properties of undefined (reading 'type')`。playground 里 `src/pages/index/uni-layout.vue` 用 `definePage({ layout: false })` 正是为了走动态分支。
- **ESM only 的连带影响**：包没有 CJS 入口，用 CJS 配置的项目加载时会报 `This package is ESM only`；同时 `@dcloudio/vite-plugin-uni` 是 CJS 包，ESM 配置下 `import uni from ...` 得到的是整个 `module.exports`，必须先取 `.default`。playground 和 README 都用 `@uni-helper/plugin-uni` 处理这一层（它内部就是 `uni.default ?? uni`）。
- **playground 的 pages.json 靠 uni-pages 生成**：`@uni-helper/vite-plugin-uni-pages` `^0.6.1`，`subPackages: ['src/pages-sub']`（相对 Vite root）、`dts: 'src/uni-pages.d.ts'`、`insertFinalNewline: true`。页面配置写在 `definePage` 宏里，`<route>` 自定义块从 uni-pages 0.4 起不再解析。`playground/src/pages.json` 和 `playground/src/uni-pages.d.ts` 是生成物但提交进仓库。
- **`@vue/compiler-sfc` 跟着 catalog 走**：升级它时要一起看 `parseSFC` 的兼容分支和快照断言，模板解析结果变化会直接反映在快照里。

## 约定

- 代码风格：`@antfu/eslint-config`（`type: 'lib'`）：单引号、无分号、import 自动排序；写完跑 `pnpm lint:fix`。不要用 eslint-disable 绕规则，规则和项目习惯冲突时改规则并说明原因。
- `.vscode/settings.json` 已提交：保存时 `source.fixAll.eslint`、禁用 prettier。
- 注释语言：源码注释是英文；README 和文档是简体中文。
- 提交信息遵循 Conventional Commits（`feat:` / `fix:` / `chore:` / `ci:` / `docs:`，常带 scope，如 `fix(utils):`）。
- 依赖版本改 `pnpm-workspace.yaml` 的 catalog，不在 `package.json` 里写死版本。
- `playground` 用 `workspace:*` 引用插件；根脚本通过 `pnpm -C playground` 调用它。改 root 脚本名时同步更新 README、CONTRIBUTING 和本文件。
