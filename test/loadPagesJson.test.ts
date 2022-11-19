import { resolve } from "path";
import { it, expect } from "vitest";
import { loadPagesJson } from "../src/utils";

it("load pages", () => {
  const cwd = resolve(__dirname, "fixtures");
  const pagesJson = loadPagesJson("src/pages.json", cwd);
  expect(pagesJson).toMatchSnapshot();
});
