import { defineConfig } from "vite";
import { tanstackStart } from "@tanstack/react-start/plugin/vite";
import viteReact from "@vitejs/plugin-react";
import tailwindcss from "@tailwindcss/vite";
import tsConfigPaths from "vite-tsconfig-paths";
import { nitro } from "nitro/vite";

export default defineConfig({
  plugins: [
    tailwindcss(),
    tsConfigPaths({ projects: ["./tsconfig.json"] }),
    tanstackStart({
      importProtection: {
        behavior: "error",
        client: {
          files: ["**/server/**"],
          specifiers: ["server-only"],
        },
      },
      server: { entry: "server" },
    }),
    nitro({
      preset: "cloudflare-pages",
    }),
    viteReact(),
  ],
  resolve: {
    alias: {
      "punycode/": "punycode",
    },
  },
  ssr: {
    external: ["mongodb"],
  },
  build: {
    commonjsOptions: {
      transformMixedEsModules: true,
    },
  },
});