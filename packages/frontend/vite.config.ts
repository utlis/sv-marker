import { dirname, join } from "path";
import { fileURLToPath } from "url";
import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import { viteStaticCopy } from "vite-plugin-static-copy";

const PYODIDE_EXCLUDE = [
  "!**/*.{md,html}",
  "!**/*.d.ts",
  "!**/*.whl",
  "!**/node_modules",
];

function viteStaticCopyPyodide() {
  const pyodideDir = dirname(fileURLToPath(import.meta.resolve("pyodide")));
  return viteStaticCopy({
    targets: [
      {
        src: [join(pyodideDir, "*")].concat(PYODIDE_EXCLUDE),
        dest: "assets",
      },
    ],
  });
}

function viteStaticCopySentenceStructureDataParserWheels() {
  const sentenceStructureDataParserWheelsDir = dirname(
    fileURLToPath(
      import.meta
        .resolve("@sentence-structure-diagram-app/sentence-structure-data-parser/browser"),
    ),
  );
  return viteStaticCopy({
    targets: [
      {
        src: [join(sentenceStructureDataParserWheelsDir, "wheels/*")],
        dest: "assets",
      },
    ],
  });
}

// https://vite.dev/config/
export default defineConfig({
  plugins: [
    react(),
    viteStaticCopyPyodide(),
    viteStaticCopySentenceStructureDataParserWheels(),
  ],
  optimizeDeps: { exclude: ["pyodide"] },
  base: process.env.BASE_URL || "/",
});
