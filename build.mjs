import { build } from "esbuild";

await build({
  entryPoints: ["src/patch.ts"],
  outfile: "dist/patch.js",
  bundle: true,
  format: "esm",
  platform: "node",
  target: "es2022",
  sourcemap: true,
  logLevel: "info"
});
