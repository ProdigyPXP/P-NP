import { build } from "esbuild";

try {
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
} catch (error) {
  console.error("Build failed:", error);
  process.exit(1);
}
