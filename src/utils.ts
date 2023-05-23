import { RootNode } from "@vue/compiler-dom";
import { readFileSync } from "fs";
import { parse } from "jsonc-parser";
import { resolve } from "path";
import { kebabCase } from "scule";
import { Page, ResolvedOptions, UserOptions } from "./types";

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
  return parse(pagesJsonRaw);
}

export function getTarget(
  path: string,
  pages: Page[] = [],
  layout = "default"
) {
  if (!(path.endsWith(".vue") || path.endsWith(".nvue"))) {
    return false;
  }
  const page = pages.find((p) => path.includes(p.path));
  if (page) {
    return {
      layout: page?.meta?.layout ?? layout,
      ...page,
    } as Required<Page>;
  }
  return false;
}
