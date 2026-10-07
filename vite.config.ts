import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import dts from 'vite-plugin-dts';
import { fileURLToPath } from 'node:url';

const r = (p: string) => fileURLToPath(new URL(p, import.meta.url));

// Library build: multi-entry (index, core, viewer, editor).
// Vite lib mode disables CSS code-splitting, so all CSS Modules are extracted
// into a single combined dist/reportkitjs.css (both the ./viewer.css and
// ./editor.css export subpaths point at it).
export default defineConfig({
  plugins: [
    react(),
    dts({
      rollupTypes: true,
      tsconfigPath: './tsconfig.json',
    }),
  ],
  build: {
    lib: {
      entry: {
        index: r('./src/index.ts'),
        core: r('./src/core/index.ts'),
        viewer: r('./src/viewer/index.ts'),
        editor: r('./src/editor/index.ts'),
        pdf: r('./src/pdf/index.ts'),
      },
      formats: ['es'],
    },
    rollupOptions: {
      external: ['react', 'react-dom', 'react/jsx-runtime'],
      output: {
        globals: {
          react: 'React',
          'react-dom': 'ReactDOM',
        },
      },
    },
    sourcemap: true,
  },
});
