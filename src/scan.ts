import fg from "fast-glob";
import { basename, dirname, extname, join, relative, resolve } from "path";
import { camelCase, pascalCase, splitByCase, kebabCase } from "scule";
import { normalizePath } from "vite";
import { Layout } from "./types";

export function scanLayouts(dir = "layouts", cwd = process.env.UNI_INPUT_DIR || process.cwd()) {
  dir = resolve(cwd, dir);
  const files = fg.sync("**/*.vue", {
    onlyFiles: true,
    ignore: ["node_modules", ".git", "**/__*__/*"],
    cwd: dir,
  });
  files.sort();

  const layouts: Layout[] = [];

  for (let file of files) {
    const filePath = normalizePath(join(dir, file));
    const dirNameParts = splitByCase(
      normalizePath(relative(dir, dirname(filePath)))
    );
    let fileName = basename(filePath, extname(filePath));
    if (fileName.toLowerCase() === "index") {
      fileName = basename(dirname(filePath));
    }

    const fileNameParts = splitByCase(fileName);
    const componentNameParts: string[] = [];

    while (
      dirNameParts.length &&
      (dirNameParts[0] || "").toLowerCase() !==
      (fileNameParts[0] || "").toLowerCase()
    ) {
      componentNameParts.push(dirNameParts.shift()!);
    }
    const pascalName =
      pascalCase(componentNameParts) + pascalCase(fileNameParts);
    const camelName = camelCase(pascalName);
    const kebabName = kebabCase(pascalName);
    layouts.push({
      name: camelName,
      path: filePath,
      pascalName,
      kebabName,
    });
  }
  return layouts;
}
