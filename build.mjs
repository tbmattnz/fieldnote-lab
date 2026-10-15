import { build } from "esbuild";
import { mkdir, copyFile } from "node:fs/promises";
await mkdir("public", { recursive: true });
await build({
  entryPoints: ["src/app.tsx"],
  bundle: true,
  minify: true,
  outfile: "public/app.js",
  jsx: "automatic",
  define: { "process.env.NODE_ENV": '"production"' },
  legalComments: "external",
});
await copyFile("src/style.css", "public/style.css");
await copyFile("src/fixtures.json", "public/fixtures.json");
console.log("Built both static demonstrations.");
