import { readFileSync } from "fs";
import { parse as jsonParse } from "jsonc-parser";
import path, { join, relative, resolve } from "path";
import { Page, ResolvedOptions, UserOptions } from "./types";
import { normalizePath } from "vite";

export function resolveOptions(userOptions: UserOptions = {}): ResolvedOptions {
  console.log('project.root', process.env.UNI_INPUT_DIR)
  return {
    layout: "default",
    layoutDir: "layouts",
    cwd: process.env.UNI_INPUT_DIR || process.cwd(),
    ...userOptions,
  };
}

export function loadPagesJson(path = "pages.json", cwd = process.env.UNI_INPUT_DIR || process.cwd()) {
  const pagesJsonRaw = readFileSync(resolve(cwd, path), {
    encoding: "utf-8",
  });
  const { easycom, pages = [], subPackages = [] } = jsonParse(pagesJsonRaw);

  return {
    easycom,
    pages: [
      ...pages,
      ...subPackages
        .map(({ pages = {}, root = "" }: any) => {
          return pages.map((page: any) => ({
            ...page,
            path: normalizePath(join(root, page.path)),
          }));
        })
        .flat(),
    ]
  };
}

export function getTarget(
  resolvePath: string,
  pages: Page[] = [],
  layout = "default",
  cwd = process.env.UNI_INPUT_DIR || process.cwd()
) {
  if (!(resolvePath.endsWith(".vue") || resolvePath.endsWith(".nvue"))) {
    return false;
  }
  const relativePath = relative(cwd, resolvePath);
  const fileWithoutExt = path.basename(
    relativePath,
    path.extname(relativePath)
  );
  const pathWithoutExt = normalizePath(
    path.join(path.dirname(relativePath), fileWithoutExt)
  );

  const page = pages.find((p) => normalizePath(p.path) === pathWithoutExt);
  if (page) {
    return {
      layout,
      ...page,
    } as Required<Page>;
  }
  return false;
}
