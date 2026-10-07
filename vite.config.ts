/// <reference types="vitest/config" />
import { fileURLToPath, URL } from 'node:url';
import react from '@vitejs/plugin-react';
import { defineConfig } from 'vite';

// GitHub Pages serves the presentation from a repository subpath, while local
// previews and external builders (including AI Studio) serve it from their own
// root. Keep Pages stable without baking its subpath into portable builds.
const base = process.env.GITHUB_ACTIONS === 'true'
  ? '/moodle-guide-presentation/'
  : '/';

export default defineConfig({
  base,
  plugins: [react()],
  resolve: {
    alias: {
      '@': fileURLToPath(new URL('./src', import.meta.url)),
    },
  },
  test: {
    environment: 'node',
    include: ['tests/**/*.test.ts'],
  },
});
