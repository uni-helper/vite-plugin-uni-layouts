import type { Node } from "@babel/types";
import { isMp } from "@uni-helper/uni-env";
import type {
  AttributeNode,
  DirectiveNode,
  ElementNode,
  SimpleExpressionNode,
} from "@vue/compiler-core";
import { babelParse, walkAST } from "ast-kit";
import MagicString from "magic-string";
import { kebabCase } from "scule";
import type { FSWatcher, ResolvedConfig, ViteDevServer } from "vite";
import { normalizePath } from "vite";
import { scanLayouts } from "./scan";
import type { Layout, Page, ResolvedOptions } from "./types";
import { getTarget, loadPagesJson, parseSFC } from "./utils";

export class Context {
  config!: ResolvedConfig;
  options: ResolvedOptions;
  pages: Page[];
  layouts: Layout[];
  pageJsonPath: string;
  private _server?: ViteDevServer;
  constructor(options: ResolvedOptions) {
    this.options = options;
    this.pages = [];
    this.layouts = scanLayouts(options.layoutDir, options.cwd);
    this.pageJsonPath = "src/pages.json";
  }

  setupViteServer(server: ViteDevServer) {
    if (this._server === server) return;

    this._server = server;
    this.setupWatcher(server.watcher);
  }

  async setupWatcher(watcher: FSWatcher) {
    watcher.on("change", async (path) => {
      if (path.includes("pages.json"))
        this.pages = loadPagesJson(this.pageJsonPath, this.options.cwd);

      // TODO: auto reload
    });
  }

  async transform(code: string, path: string) {
    // no layouts
    if (!this.layouts.length) return;
    // no pages
    if (!this.pages?.length)
      this.pages = loadPagesJson(this.pageJsonPath, this.options.cwd);

    const page = getTarget(
      path,
      this.pages,
      this.options.layout,
      this.config?.root || this.options.cwd
    );

    // is not page
    if (!page) return;

    let pageLayoutName: string | undefined | false = page.layout;
    let pageLayout: Layout | undefined;
    const pageLayoutProps: string[] = [];

    if (typeof pageLayoutName === "boolean" && pageLayoutName)
      pageLayoutName = "default";

    if (typeof pageLayoutName === "string") {
      // layout name is empty
      if (!pageLayoutName) return;
      pageLayout = this.layouts.find(
        (l) => l.name === (pageLayoutName as string)
      );
      // can not find layout
      if (!pageLayout) return;
    }
    const disabled = typeof pageLayoutName === "boolean" && !pageLayoutName;

    const sfc = await parseSFC(code);
    const ms = new MagicString(code);
    const setupCode = sfc.scriptSetup?.loc.source;
    // check has uniLayout ref
    if (setupCode) {
      const setupAst = babelParse(setupCode, sfc.scriptSetup?.lang);
      walkAST<Node>(setupAst, {
        enter(node) {
          if (node.type === "VariableDeclarator") {
            const hasUniLayoutVar =
              node.id.type === "Identifier" && node.id.name === "uniLayout";
            const isRef =
              node.init?.type === "CallExpression" &&
              node.init.callee.type === "Identifier" &&
              node.init.callee.name === "ref";
            if (hasUniLayoutVar && isRef)
              pageLayoutProps.push('ref="uniLayout"');
          }
        },
      });
    }

    // 检查是否有 page-meta 组件
    let pageMetaNodes: ElementNode[] = [];
    if (sfc.template?.ast) {
      pageMetaNodes = sfc.template.ast.children.filter(
        (v) =>
          v.type === 1 &&
          (kebabCase(v.tag) === "page-meta" || v.tag === "page-meta")
      ) as ElementNode[];
    }

    if (disabled) {
      // find dynamic layout
      const uniLayoutNode = sfc.template?.ast.children.find(
        (v) => v.type === 1 && kebabCase(v.tag) === "uni-layout"
      ) as ElementNode;
      // not found
      if (!uniLayoutNode) return;

      ms.overwrite(
        uniLayoutNode.loc.start.offset,
        uniLayoutNode.loc.end.offset,
        this.generateDynamicLayout(uniLayoutNode)
      );
    } else {
      if (sfc.template?.loc.start.offset && sfc.template?.loc.end.offset) {
        // 提取 page-meta 组件内容
        const pageMetaContent = pageMetaNodes
          .map((node) => node.loc.source)
          .join("\n");

        // 从原内容中移除 page-meta 组件
        let contentWithoutPageMeta = sfc.template.content;
        for (const node of pageMetaNodes) {
          contentWithoutPageMeta = contentWithoutPageMeta.replace(
            node.loc.source,
            ""
          );
        }

        // 在布局外部添加 page-meta
        ms.overwrite(
          sfc.template?.loc.start.offset,
          sfc.template?.loc.end.offset,
          `\n${pageMetaContent}<layout-${
            pageLayout?.kebabName
          }-uni ${pageLayoutProps.join(
            " "
          )}>${contentWithoutPageMeta}</layout-${pageLayout?.kebabName}-uni>\n`
        );
      }
    }

    if (ms.hasChanged()) {
      const map = ms.generateMap({
        source: path,
        file: `${path}.map`,
        includeContent: true,
      });
      return {
        code: ms.toString(),
        map,
      };
    }
  }

  async virtualModule() {
    const imports: string[] = [];
    const components: string[] = [];
    const _exports = this.layouts.map((v) => {
      imports.push(
        `import Layout_${v.pascalName}_Uni from "${normalizePath(v.path)}"`
      );
      components.push(
        `app.component("layout-${v.kebabName}-uni", Layout_${v.pascalName}_Uni)`
      );
      return `Layout_${v.pascalName}_Uni,`;
    });
    return `${imports.join("\n")}
export const layouts = {
  ${_exports.join("\n")}
}
export default {
  install(app) {
    ${components.join("\n")}
  }
}`;
  }

  generateDynamicLayout(node: ElementNode) {
    const staticLayoutNameBind = node.props.find(
      (v) => v.type === 6 && v.name === "name" && v.value?.content
    ) as AttributeNode;
    const dynamicLayoutNameBind = node.props.find(
      (v) =>
        v.type === 7 &&
        v.name === "bind" &&
        v.arg?.type === 4 &&
        v.arg?.content === "name" &&
        v.exp?.type === 4 &&
        v.exp.content
    ) as DirectiveNode;
    const slotsSource = node.children.map((v) => v.loc.source).join("\n");
    const nodeProps = node.props
      .filter(
        (prop) =>
          !(prop === dynamicLayoutNameBind || prop === staticLayoutNameBind)
      )
      .map((v) => v.loc.source);

    if (!(staticLayoutNameBind || dynamicLayoutNameBind))
      console.warn(
        "[vite-plugin-uni-layouts] Dynamic layout not found name bind"
      );

    if (isMp) {
      const props: string[] = [...nodeProps];
      if (staticLayoutNameBind) {
        const layout = staticLayoutNameBind.value?.content;
        return `<layout-${layout}-uni ${props.join(
          " "
        )}>${slotsSource}</layout-${layout}-uni>`;
      }

      const bind = (dynamicLayoutNameBind.exp as SimpleExpressionNode).content;
      const defaultSlot = node.children.filter((v) => {
        if (v.type === 1 && v.tagType === 3) {
          const slot = v.props.find(
            (v) => v.type === 7 && v.name === "slot" && v.arg?.type === 4
          ) as any;
          if (slot) return slot.arg.content === "default";
        }
        return v;
      });
      const defaultSlotSource = defaultSlot.map((v) => v.loc.source).join("\n");
      const layouts = this.layouts.map(
        (layout, index) =>
          `<layout-${layout.kebabName}-uni v-${
            index === 0 ? "if" : "else-if"
          }="${bind} ==='${layout.kebabName}'" ${props.join(
            " "
          )}>${slotsSource}</layout-${layout.kebabName}-uni>`
      );
      layouts.push(`<template v-else>${defaultSlotSource}</template>`);

      return layouts.join("\n");
    } else {
      const props: string[] = [...nodeProps];
      if (staticLayoutNameBind)
        props.push(`is="layout-${staticLayoutNameBind.value?.content}-uni"`);
      else
        props.push(
          `:is="\`layout-\${${
            (dynamicLayoutNameBind.exp as SimpleExpressionNode).content
          }}-uni\`"`
        );
      return `<component ${props.join(" ")}>${slotsSource}</component>`;
    }
  }

  async importLayoutComponents(code: string, id: string) {
    const ms = new MagicString(code);
    const imports: string[] = [];
    const components: string[] = [];
    for (const v of this.layouts) {
      imports.push(
        `import Layout_${v.pascalName}_Uni from "${normalizePath(v.path)}"`
      );
      components.push(
        `app.component("layout-${v.kebabName}-uni", Layout_${v.pascalName}_Uni);\n`
      );
    }
    ms.append(imports.join("\n"));
    ms.replace(
      /(createApp[\s\S]*?)(return\s{\s*app)/,
      `$1${components.join("")}$2`
    );
    const map = ms.generateMap({
      source: id,
      file: `${id}.map`,
      includeContent: true,
    });
    code = ms.toString();
    return {
      code,
      map,
    };
  }
}
