import { FSWatcher, normalizePath, ResolvedConfig, ViteDevServer } from "vite";
import { scanLayouts } from "./scan";
import { Layout, Page, ResolvedOptions } from "./types";
import { getTarget, loadPagesJson } from "./utils";
import MagicString from "magic-string";
import { ElementNode, parse } from "@vue/compiler-dom";
import { kebabCase } from "scule";
import { isH5 } from "@uni-helper/uni-env";
import { resolve } from "path";

export class Context {
  config!: ResolvedConfig;
  options: ResolvedOptions;
  pages: Page[];
  layouts: Layout[];
  private _server?: ViteDevServer;
  constructor(options: ResolvedOptions) {
    this.options = options;
    this.pages = [];
    this.layouts = scanLayouts(options.layoutDir, options.cwd);
  }

  setupViteServer(server: ViteDevServer) {
    if (this._server === server)
      return

    this._server = server
    this.setupWatcher(server.watcher)
  }

  async setupWatcher(watcher: FSWatcher) {
    watcher.on("change", async (path) => {
      if (
        normalizePath(path) ===
        normalizePath(resolve(this.options.cwd, "src/pages.json"))
      )
        this.pages = loadPagesJson("src/pages.json", this.options.cwd);
        // TODO: auto reload
    });
  }

  transform(code: string, path: string) {
    if (!this.pages?.length) {
      this.pages = loadPagesJson("src/pages.json", this.options.cwd);
    }
    const page = getTarget(
      path,
      this.pages,
      this.options.layout,
      this.config.root
    );
    if (!page) return;
    if (!this.layouts.length) return;
    let layoutName: string | undefined | false = page.layout;
    let layout: Layout | undefined;

    if (typeof layoutName === "boolean" && layoutName) {
      layoutName = "default";
    }

    if (typeof layoutName === "string") {
      if (!layoutName) return;
      layout = this.layouts.find((l) => l.name === (layoutName as string));
      if (!layout) return;
    }

    const ast = parse(code);
    const ms = new MagicString(code);
    let sourceWithoutRoot = "";
    const rootTemplate = ast.children.find(
      (node) => node.type === 1 && node.tag === "template"
    ) as ElementNode;
    if (!rootTemplate) return;
    const isDisabledLayout = typeof layoutName === "boolean" && !layoutName;
    if (isDisabledLayout) {
      const uniLayoutComponent = rootTemplate.children.find(
        (node) => node.type === 1 && kebabCase(node.tag) === "uni-layout"
      ) as ElementNode;

      if (uniLayoutComponent) {
        for (const prop of uniLayoutComponent.props) {
          if (prop.name === "name" && prop.type === 6) {
            layoutName = prop.value?.content;
            // not set layout
            if (!layoutName) return;
            layout = this.layouts.find(
              (l) => l.name === (layoutName as string)
            );
            if (!layout) return;
          }
        }
        sourceWithoutRoot += uniLayoutComponent.children
          .map((v) => v.loc.source)
          .join("\n");
      } else {
        return;
      }
    } else {
      sourceWithoutRoot += rootTemplate.children
        .map((v) => v.loc.source)
        .join("");
    }
    ms.replace(rootTemplate.loc.source, "");
    ms.prepend(`
<template>
  <layout-${layout?.kebabName}-uni>
    ${sourceWithoutRoot}
  </layout-${layout?.kebabName}-uni>
</template>
`);
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

  async virtualModule() {
    let imports: string[] = [];
    let components: string[] = [];
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

  async importLayoutComponents(code: string, id: string) {
    const ms = new MagicString(code);
    let imports: string[] = [];
    let components: string[] = [];
    for (let v of this.layouts) {
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
