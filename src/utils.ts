import { readFileSync } from "fs";
import { parse as jsonParse } from "jsonc-parser";
import path, { join, relative, resolve } from "path";
import { Page, ResolvedOptions, UserOptions } from "./types";
import { normalizePath } from "vite";

export function resolveOptions(userOptions: UserOptions = {}): ResolvedOptions {
  return {
    layout: "default",
    layoutDir: "src/layouts",
    cwd: process.cwd(),
    ...userOptions,
  };
}

export function loadPagesJson(path = "src/pages.json", cwd = process.cwd()) {
  const pagesJsonRaw = readFileSync(resolve(cwd, path), {
    encoding: "utf-8",
  });
  const { pages = [], subPackages = [] } = jsonParse(pagesJsonRaw);

  return [
    ...pages,
    ...subPackages
      .map(({ pages = {}, root = "" }: any) => {
        return pages.map((page: any) => ({
          ...page,
          path: normalizePath(join(root, page.path)),
        }));
      })
      .flat(),
  ];
}

export function getTarget(
  resolvePath: string,
  pages: Page[] = [],
  layout = "default",
  cwd = process.cwd()
) {
  if (!(resolvePath.endsWith(".vue") || resolvePath.endsWith(".nvue"))) {
    return false;
  }
  const relativePath = relative(join(cwd, "src"), resolvePath);
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
