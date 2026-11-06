# 参与贡献

感谢你愿意为这个项目贡献时间。本文档介绍项目结构、本地开发流程、测试方式和提交规范。

## 前置条件

- [Node.js](https://nodejs.org/) 26（见仓库根目录 `.node-version`）
- [pnpm](https://pnpm.io/) 12.16.1（见根 `package.json` 的 `packageManager` 和 `devEngines` 字段，建议配合 Corepack 启用）

`package.json` 的 `engines` 允许 `^22.22.2 || ^24.15.0 || >=26.0.0`，CI 会在这几个大版本上各跑一遍。

## 仓库结构

```text
.
├── src/                  # 插件源码
│   ├── index.ts          # Vite 插件入口：虚拟模块、main 注入、transform 分发
│   ├── context.ts        # Context 类：页面模板改写、动态布局展开、虚拟模块代码
│   ├── scan.ts           # 扫描 layoutDir，推导布局组件名
│   ├── utils.ts          # pages.json 读取、页面匹配、标记 ref 识别
│   ├── types.ts          # 插件选项与布局元数据类型
│   ├── declaration.ts    # 生成 uni-layouts.d.ts 声明文件
│   └── constant.ts       # 虚拟模块 ID 与 useUhUniLayoutRef 的代码片段
├── test/                 # vitest 测试（部分用快照断言）
│   └── fixtures/         # 测试用布局与 pages.json
├── playground/           # 示例 uni-app 应用（workspace 成员，用于本地调试）
├── client.d.ts           # virtual:uni-layouts 的类型声明
├── tsdown.config.ts      # tsdown 构建配置（只产出 ESM）
├── eslint.config.js      # @antfu/eslint-config
└── pnpm-workspace.yaml   # workspace 成员与依赖 catalog
```

依赖版本统一写在 `pnpm-workspace.yaml` 的 `catalog` 里，`package.json` 用 `catalog:` 引用。改版本时改 catalog，不要直接写死。

## 常用命令

所有命令都在仓库根目录执行。

```bash
# 安装依赖
pnpm install

# 构建插件到 dist/
pnpm build

# watch 模式构建，改 src 后直接跑 playground 会自动生效
pnpm dev

# 类型检查（不含 playground）
pnpm typecheck

# 代码检查与自动修复
pnpm lint
pnpm lint:fix

# 测试，watch 模式
pnpm test

# 测试，跑一次
pnpm exec vitest run

# 启动 playground
pnpm dev:play:h5
pnpm dev:play:mp-weixin

# 构建 playground，检查产物
pnpm build:play:h5
pnpm build:play:mp-weixin
```

playground 通过 `workspace:*` 引用本插件，用 `@uni-helper/vite-plugin-uni-pages` 生成路由和页面配置，用 `@uni-helper/plugin-uni` 加载 uni-app 插件。它自己的类型检查在 `playground` 目录下跑 `pnpm typecheck`（`vue-tsc --noEmit`）。

## 测试

测试在根 `test/` 目录，fixtures 在 `test/fixtures`，用 [Vitest](https://vitest.dev/) 编写，部分用例用快照断言：

```text
test/
├── context.test.ts                       模板改写、ref 注入、布局名与标签位置警告
├── context-mp.test.ts                    小程序分支的 ref 注入
├── declaration.test.ts                   声明文件内容与写入规则
├── find-layout-ref-name.test.ts          标记 ref 的识别
├── get-pages-with-changed-layout.test.ts 布局变化后要重载的页面
├── get-source-url.test.ts                页面模块 URL
├── is-layout-file.test.ts                布局文件判断
├── is-target.test.ts                     页面匹配
├── load-pages-json.test.ts               pages.json 与分包合并
├── resolve-options.test.ts               选项默认值与声明文件路径
├── scan-layouts.test.ts                  布局扫描与命名推导
├── setup-watcher.test.ts                 watcher 驱动的模块失效
└── fixtures/                             布局、pages.json 等测试夹具
```

`test/fixtures` 在 eslint 里被整体忽略，夹具可以写得随意一些。快照文件在 `test/__snapshots__`，输出格式变了就先确认新输出对不对，再用 `pnpm exec vitest run -u` 更新，并在 PR 里说明原因。

新增测试请断言行为，不要断言实现细节。

## 持续集成

`.github/workflows/ci.yml` 在 Linux、macOS、Windows 三个系统上分别用 Node.js 22、24、26 跑一遍：

```text
pnpm build → pnpm build:play:h5 → pnpm build:play:mp-weixin → pnpm lint → pnpm test → pnpm typecheck
```

这六步在本地也能跑，提交前过一遍能省一次往返。CI 不跑 playground 的类型检查，改 playground 时本地补一条 `pnpm -C playground typecheck`。

## 提交规范

1. Fork 仓库并创建分支，分支名用 `feat/xxx`、`fix/xxx`、`docs/xxx`。
2. 提交信息遵循 [Conventional Commits](https://www.conventionalcommits.org/zh-hans/)，可带 scope，如 `fix(utils): fix path format`、`feat: support dynamic layout`。
3. 推送分支并打开 Pull Request，说明改动动机；涉及用法变化时同步更新 README。

## Pull Request 指南

- 一个 PR 解决一个问题，不要夹带无关改动。
- 新增选项、重构模块这类改动，先开 issue 讨论方案再动手。
- 改插件选项或用法时，同步更新根 README；改构建或开发流程时，同步更新本文件和 `AGENTS.md`。

## 发布

仅维护者操作：

1. `pnpm release` 调用 `bumpp`，改版本号、提交并打 `v*` tag 后推送。
2. tag 推送后 `.github/workflows/release.yml` 触发：用 changelogithub 创建 GitHub Release，再 `pnpm publish --access public` 发布到 npm。

## 行为准则

本项目遵循 [uni-helper 行为准则](https://github.com/uni-helper/.github/blob/main/CODE_OF_CONDUCT.md)。

有问题或建议请到 [GitHub Issues](https://github.com/uni-helper/vite-plugin-uni-layouts/issues) 反馈。
