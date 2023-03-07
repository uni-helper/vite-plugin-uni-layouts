import { normalizePath, ResolvedConfig } from "vite";
import { scanLayouts } from "./scan";
import { Layout, Page, ResolvedOptions } from "./types";
import { getTarget, loadPagesJson } from "./utils";
import MagicString from "magic-string";
import { parse } from "@vue/compiler-dom";
import { kebabCase } from "scule";

export class Context {
  config!: ResolvedConfig;
  options: ResolvedOptions;
  pages: {
    pages?: Page[];
  };
  layouts: Layout[];
  constructor(options: ResolvedOptions) {
    this.options = options;
    this.pages = loadPagesJson("src/pages.json", options.cwd);
    this.layouts = scanLayouts(options.layoutDir, options.cwd);
  }

  transform(code: string, path: string) {
    const page = getTarget(path, this.pages.pages, this.options.layout);
    if (!page) return;
    if (!this.layouts.length) return;
    let layoutName: string | undefined | false = page.layout;
    let layout: Layout | undefined;

    if (typeof layoutName === "string") {
      if (!layoutName) return;
      layout = this.layouts.find((l) => l.name === (layoutName as string));
      if (!layout) return;
    }

    const ast = parse(code);
    const ms = new MagicString(code);
    let sourceWithoutRoot = "";
    for (const node of ast.children) {
      if (node.type !== 1) {
        return;
      }
      if (node.tag === "template") {
        if (typeof layoutName === "boolean" && !layoutName) {
          const maybeUniLayout = node.children[0];
          if (
            maybeUniLayout.type === 1 &&
            kebabCase(maybeUniLayout.tag) === "uni-layout"
          ) {
            for (const prop of maybeUniLayout.props) {
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

            sourceWithoutRoot += maybeUniLayout.children
              .map((v) => v.loc.source)
              .join("\n");
          } else {
            return;
          }
        } else {
          sourceWithoutRoot += node.children.map((v) => v.loc.source).join("");
        }
        ms.replace(node.loc.source, "");
      }
    }
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
