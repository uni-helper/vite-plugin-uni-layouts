import { resolve } from "path";
import { expect, it } from "vitest";
import { scanLayouts } from "../src/scan";

it("scanLayouts", () => {
  const cwd = resolve(__dirname, "fixtures");
  const layouts = scanLayouts("src/layouts", cwd);
  expect(
    layouts.map((v) => {
      return {
        ...v,
        path: v.path.slice(cwd.length + 1),
      };
    })
  ).toMatchSnapshot();
});
