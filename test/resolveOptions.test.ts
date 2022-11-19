import { it, expect } from "vitest";
import { resolveOptions } from "../src/utils";

it("resolve user options", () => {
  const options = resolveOptions({
    layout: "home",
    layoutDir: "src/layout",
  });
  expect(options).toMatchSnapshot("userOptions");
});

it("resolve default options", () => {
  const options = resolveOptions();
  expect(options).toMatchSnapshot("default");
});
