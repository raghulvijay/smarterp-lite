import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import path from "path";

export default defineConfig({
  plugins: [react()],
  resolve: {
    // Hard-alias react/react-dom to the project-root copies so every package
    // in the graph (devextreme-react, react-router, recharts, etc.) resolves
    // to the exact same CJS module instance.  Without this, Vite's CJS→ESM
    // interop can hand out a null namespace to packages that do
    // `import * as React from 'react'`, causing the
    // "Cannot read properties of null (reading 'useContext')" crash.
    dedupe: ["react", "react-dom", "react-router-dom"],
    alias: {
      "react":     path.resolve(process.cwd(), "node_modules/react"),
      "react-dom": path.resolve(process.cwd(), "node_modules/react-dom"),
    },
  },
  optimizeDeps: {
    include: [
      "react",
      "react-dom",
      "react-router-dom",
      "react-router",
      "@remix-run/router",
    ],
  },
  server: { port: 5173 },
  build: {
    chunkSizeWarningLimit: 2000,
    rollupOptions: {
      output: {
        manualChunks: {
          "vendor-react":     ["react", "react-dom", "react-router-dom"],
          "vendor-bootstrap": ["bootstrap", "react-bootstrap"],
          "vendor-recharts":  ["recharts"],
        },
      },
    },
  },
});
