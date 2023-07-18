import { createFilter, Plugin } from "vite";
import { virtualModuleId } from "./constant";
import { Context } from "./context";
import { UserOptions } from "./types";
import { resolveOptions } from "./utils";

export const VitePluginUniLayouts = (userOptions: UserOptions = {}): Plugin => {
  const options = resolveOptions(userOptions);
  const ctx = new Context(options);
  return {
    name: "vite-plugin-uni-layouts",
    enforce: "pre",
    configResolved(config) {
      ctx.config = config;
    },
    configureServer(server){
      ctx.setupViteServer(server)
    },
    resolveId(id) {
      if (id === virtualModuleId) {
        return id;
      }
    },
    load(id) {
      if (id === virtualModuleId) {
        return ctx.virtualModule();
      }
    },
    transform(code, id) {
      const filter = createFilter("src/main.(ts|js)");
      if (filter(id)) {
        return ctx.importLayoutComponents(code, id);
      }
      return ctx.transform(code, id);
    },
  };
};

export default VitePluginUniLayouts;
