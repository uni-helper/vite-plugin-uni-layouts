import { resolve } from "path";
import { it, expect } from "vitest";
import { Context } from "../src/context";
import { Layout } from "../src/types";
import { resolveOptions } from "../src/utils";

let ctx = new Context(
  resolveOptions({
    cwd: resolve(__dirname, "fixtures"),
  })
);

const defaultLayout = ctx.layouts.find((l) => l.name === "default") as Layout;

it("use default layout", () => {
  const code = ctx.transform(
    `<template><div>hello</div></template>`,
    "pages/index/index.vue"
  );
  expect(code?.code).toMatchSnapshot();
});

it("use test layout", () => {
  const code = ctx.transform(
    `<template><main></main></template>`,
    "pages/index/test.vue"
  );
  expect(code?.code).toMatchSnapshot();
});
it("use inline layout", () => {
  const code = ctx.transform(
    `<template>
    <UniLayout name="camelLayout">
        <main></main>
    </UniLayout>
  </template>`,
    "pages/index/disabled.vue"
  );
  expect(code?.code).toMatchSnapshot();
});

