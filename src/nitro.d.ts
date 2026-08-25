declare module "nitro/vite" {
  import type { Plugin } from "vite";

  export interface NitroPluginConfig {
    preset?: string;
    [key: string]: any;
  }

  export function nitro(pluginConfig?: NitroPluginConfig): Plugin[];
}
