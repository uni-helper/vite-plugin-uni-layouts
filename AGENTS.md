# vite-plugin-uni-layouts

在 Vite 驱动的 uni-app 中提供布局框架：构建期扫描 `src/layouts` 生成虚拟模块 `virtual:uni-layouts` 并全局注册布局组件，transform 阶段按 pages.json 的 `layout` 字段把页面模板包进对应布局组件。无 CLAUDE.md；playground 是本仓库唯一的 workspace 成员，没有独立 AGENTS.md（差异点在下方架构与约定）。

## 项目

- TypeScript，`strict: true`（tsconfig.json 只排除 `playground/**`）；`"type": "module"`，产物只有 ESM：`dist/index.mjs` 和 `dist/index.d.mts`，插件入口只有 `src/index.ts`。应用侧用的 `useUhUniLayoutRef` 由虚拟模块 `virtual:uni-layouts` 提供，不单独发运行时文件。`exports` 里没有 `require` 条件，`main` 也指向 `.mjs`。
- 构建用 tsdown（`tsdown.config.ts`：`format: 'esm'`、`dts: true`、`clean: true`）。`vite` 是 devDependency 且列在 `deps.neverBundle`，其余依赖保持外部 import，不打进产物。发布内容是 `dist` 加根级 `client.d.ts`（经 `exports["./client"]` 提供 `virtual:uni-layouts` 的类型）。虚拟模块的代码是 `src/constant.ts` 里的字符串，类型靠插件生成的 `uni-layouts.d.ts`。
- Node：`.node-version` 是 26，`devEngines.runtime` 26（`onFail: warn`），`engines` 允许 `^22.22.2 || ^24.15.0 || >=26.0.0`。包管理器 pnpm 12.16.1（`packageManager` + `devEngines`）。workspace 只含 `playground`。
- 版本统一写在 `pnpm-workspace.yaml` 的 `catalog`，`package.json` 一律用 `catalog:` 引用。同一文件的 `trustPolicy` 目前是 `off`，`configDependencies` 里装 `@pnpm/plugin-trusted-deps`，另有 `minimumReleaseAgeExcludePrune`、`shellEmulator`、`allowBuilds` 几项 pnpm 设置。
- 依赖：tinyglobby（扫布局）、scule（大小写推导）、`@vue/compiler-core` + `@vue/compiler-sfc`（catalog 钉 `~3.4.38`，解析模板用）、ast-kit（`babelParse` 解析 script setup）、magic-string 1.x、jsonc-parser、chokidar（catalog 用 `^3.6.0`，锁在 3.x，`FSWatcher` 类型和 Vite 5 的 watcher 对得上）、@uni-helper/uni-env。
- 开发依赖：vite 5、vitest 3、typescript 6、tsdown、@antfu/eslint-config 10、vue（playground 与类型用）。
- 测试：vitest，无配置文件，测试在根 `test/`，直接 import `src/`，部分用例用快照断言；fixtures 在 `test/fixtures`（PascalCase / camelCase / kebab-case / 嵌套 / no-index 布局 + pages.json）。`test/fixtures` 在 eslint 里整体忽略。
- CI：`.github/workflows/ci.yml`，Linux / macOS / Windows × Node 22 / 24 / 26，依次跑 build、build:play:h5、build:play:mp-weixin、lint、test、typecheck。playground 自己的 `vue-tsc` 不在 CI 里。发布走 `pnpm release`（bumpp）→ `v*` tag → `release.yml`（changelogithub + `pnpm publish`）。

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
| `src/index.ts` | 插件入口：`enforce: 'pre'`；`configResolved` 里 `build.watch` 时用 chokidar 监听 `src/pages.json` 和 `pages.json`；`buildStart` 写声明文件（写失败只 warn，不影响构建）；`configureServer` 接 Vite 的 watcher；`resolveId` / `load` 提供 `virtual:uni-layouts`（布局记录 + 插件 + `useUhUniLayoutRef`）；`transform` 先匹配 `src/main.(ts\|js)` / `main.(ts\|js)` 注入布局注册，其余交给 `ctx.transform` |
| `src/context.ts` | Context 类：页面 transform、`<uh-uni-layout>` 动态布局改写、`importLayoutComponents`（main 注入）、`virtualModule` 代码生成、watcher 驱动的页面 / 布局重载 |
| `src/scan.ts` | `scanLayouts`：tinyglobby 扫 `layoutDir` 下 `**/*.vue`（忽略 `**/__*__/*`），结果排序，推导 name / pascalName / kebabName |
| `src/utils.ts` | `resolveOptions`（含 `dts` 路径）/ `getPageJsonPath` / `loadPagesJson`（先按 `UNI_PLATFORM` 处理页面的条件编译，再用 jsonc 解析，合并 subPackages）/ `getTarget` / `findLayoutRefName`（识别标记 ref）/ `parseSFC`（兼容 compiler-sfc 2.7 的返回形状）；HMR 用的 `invalidateAndReload` / `isLayoutFile` / `getPagesWithChangedLayout` / `getSourceUrl` |
| `src/types.ts` | `Options`（layout / layoutDir / cwd / dts）、`Layout`、`Page` |
| `src/constant.ts` | `virtualModuleId = 'virtual:uni-layouts'`；`runtimeModuleCode` 是虚拟模块里 `useUhUniLayoutRef`（返回 `shallowRef(null)`，只是给插件识别的标记 ref）的代码片段 |
| `src/declaration.ts` | 生成 `uni-layouts.d.ts`：为 `virtual:uni-layouts` 补上 `useUhUniLayoutRef` 的类型（`client.d.ts` 声明同一个模块的其余导出，两处合并），并按扫描到的布局名写 `LayoutKey` 联合类型和全局接口 `UniHelperUniLayouts`（`@uni-helper/uni-pages-types` 的 `PageItem.layout` 读它，所以文件必须保持 script，见函数注释）；布局名去重排序，为空时 `LayoutKey` 退回 `string`；内容不变时不重写，文件开头没有生成标记时不覆盖 |
| `client.d.ts` | `virtual:uni-layouts` 声明：`layouts` 组件记录 + 默认导出 Vue Plugin |
| `test/` | vitest：快照测试 + fixtures；HMR 相关用普通断言，`setup-watcher.test.ts` 用假 server 记录插件要失效哪些模块 |

关键行为：

- **布局名推导**（scan.ts）：文件名为 `index` 时取父目录名；目录段逐段与文件名段比对（scule `splitByCase`，大小写不敏感），相同的段及之后丢弃，剩余目录段 + 文件名段拼出 pascalName，`name` 是 camelCase，注册的组件名是 `layout-{kebabName}-uni`。页面配置里写的是 `name`（camelCase）。
- **页面匹配**（utils.ts `getTarget`）：只处理 `.vue` / `.nvue`；路径在 `src/` 下则相对 `src` 解析，去扩展名后与 pages.json 的 `path`（含 subPackages 的 `root` 前缀）比对。uni-pages 0.6 生成的分包条目正好是 `root` + 页面相对分包的 `path`，拼起来等于源码相对 `src` 的位置。
- **pages.json 条件编译**（utils.ts `parsePagesJson`）：行级处理 `#ifdef` / `#ifndef` / `#else` / `#endif`，可以嵌套，`||` 连接多平台；平台取 `process.env.UNI_PLATFORM`，`mp-weixin` 和 `mp_weixin` 两种写法都认。`#ifdef` 没闭合时 warn 一次，后面的页面会被当成别的平台的配置丢掉。
- **layout 字段语义**（context.ts）：缺省 → 用选项 `layout`（默认 `default`）；字段类型是 `string | false`，运行时还接受 `true`，直接当 `default`，不经过选项；`false` → 禁用静态布局，走 `<uh-uni-layout>` 动态分支；字符串找不到对应布局 → warn（带页面路径和布局名；名字等于 `layout` 选项时说明用的是默认布局），页面原样返回、不套布局；空串 → 静默原样返回。布局目录扫不到任何布局 → 每次重新扫描后 warn 一次（带目录路径），所有页面都不套布局。
- **模板改写**：非禁用页面把整个 `<template>` 内容包进 `<layout-{kebabName}-uni>`；页面模板顶层的 `<page-meta>` 会被提到布局组件前面（`<page-meta>` 只有作为页面第一个节点才生效），`layout: false` 的页面不动。`utils.ts` 的 `findLayoutRefName` 扫 script setup 顶层声明：`const x = useUhUniLayoutRef()`（名字任意；页面从 `virtual:uni-layouts` 以外的地方 import 同名函数时不算，没写 import 的裸调用照旧认，留给 auto-import）或旧的 `const uniLayout = ref()` / `shallowRef()`，命中就给包裹标签加 `ref="<变量名>"`，动态分支也加（页面在 `<uh-uni-layout>` 上自己写了 `ref` 时不加，避免重复属性）。小程序编译器只认 setup 绑定里的名字，所以不能靠 `$refs` 或运行时注册（`uni-mp-vue` 的 `setTemplateRef` 对字符串只在 `hasOwn(setupState, name)` 时写入，`instance.refs` 从不写）。`<uh-uni-layout>` 动态分支按平台分叉：小程序端展开成每个布局的 `v-if` / `v-else-if` 链（条件是 name 绑定表达式 `=== '{kebabName}'`），H5 端生成 `<component is="layout-{name}-uni">`。
- **main 注入很脆**（context.ts `importLayoutComponents`）：用正则 `/(createApp[\s\S]*?)(return\s\{\s*app)/` 往 createApp 调用里插 `app.component(...)`，依赖 main 文件的书写形状；全局注册还有 `virtual:uni-layouts` 一条路（默认导出的 install 插件逐个 `app.component`）。
- **HMR**：watcher 收到 pages.json 的 `change` 后重载页面列表，再按 `path` 对齐只失效 `layout` 变了的页面模块（`.vue` / `.nvue` 都试）；布局目录下 `.vue` / `.nvue` 的 `add` / `unlink` 会重扫布局，重写声明文件（`LayoutKey` 跟着变），再失效虚拟模块、`main.ts` 和所有页面模块，新增的布局不用重启就能生效。`build.watch` 下 chokidar 同时监听布局目录，走同一条路径。build watch 下没有 dev server，pages.json 变化只更新页面列表。
- **动态布局标签要顶层、要关掉静态布局**：`<uh-uni-layout>` 只在 `layout: false` 的页面里被改写，插件只扫模板顶层节点。标签留在模板里没有别的代码处理它，所以两种失效情况各有一条 warn：页面没关静态布局、标签不在顶层。v0.3 前这个标签叫 `<uni-layout>`，那是 uni-app H5 的内置自定义元素（`@dcloudio/uni-shared` 的 `TAGS` 由 `uni-` + 名单拼出）。编译器把它当普通元素，具名插槽的 `<template>` 拿不到 codegen 节点，H5 报 `Cannot read properties of undefined (reading 'type')`（dev 构建里是 `Codegen node is missing for element/if/for node`）。页面里还留着旧标签时插件也 warn 一次，提示改名。playground 的 `src/pages/index/uh-uni-layout.vue` 用 `definePage({ layout: false })` 走动态分支。
- **ESM only 的连带影响**：包没有 CJS 入口，用 CJS 配置的项目加载时会报 `This package is ESM only`；同时 `@dcloudio/vite-plugin-uni` 是 CJS 包，ESM 配置下 `import uni from ...` 得到的是整个 `module.exports`，必须先取 `.default`。playground 和 README 都用 `@uni-helper/plugin-uni` 处理这一层（它内部就是 `uni.default ?? uni`）。
- **`dts` 选项**：默认 `true`，写到 pages.json 同目录的 `uni-layouts.d.ts`；字符串按 `cwd` 解析；`false` 不写。内容包含 `useUhUniLayoutRef` 类型、`LayoutKey` 和 `UniHelperUniLayouts`；写失败只 warn，不影响构建。playground 在 `vite.config.mts` 里显式设成 `src/uni-layouts.d.ts`，生成物提交进仓库。
- **playground 的 pages.json 靠 uni-pages 生成**：`@uni-helper/vite-plugin-uni-pages` `^0.6.1`，`subPackages: ['src/pages-sub']`（相对 Vite root）、`dts: 'src/uni-pages.d.ts'`、`insertFinalNewline: true`。页面配置写在 `definePage` 宏里，`<route>` 自定义块从 uni-pages 0.4 起不再解析。`playground/src/pages.json` 和 `playground/src/uni-pages.d.ts` 是生成物但提交进仓库。
- **`@vue/compiler-sfc` 跟着 catalog 走**：升级它时要一起看 `parseSFC` 的兼容分支和快照断言，模板解析结果变化会直接反映在快照里。

## 约定

- 代码风格：`@antfu/eslint-config`（`type: 'lib'`）：单引号、无分号、import 自动排序；写完跑 `pnpm lint:fix`。不要用 eslint-disable 绕规则，规则和项目习惯冲突时改规则并说明原因。
- `.vscode/settings.json` 已提交：保存时 `source.fixAll.eslint`、禁用 prettier。
- 注释语言：源码注释是英文；README 和文档是简体中文。
- 提交信息遵循 Conventional Commits（`feat:` / `fix:` / `chore:` / `ci:` / `docs:`，常带 scope，如 `fix(utils):`）。
- 依赖版本改 `pnpm-workspace.yaml` 的 catalog，不在 `package.json` 里写死版本。
- `playground` 用 `workspace:*` 引用插件；根脚本通过 `pnpm -C playground` 调用它。改 root 脚本名时同步更新 README、CONTRIBUTING 和本文件。
