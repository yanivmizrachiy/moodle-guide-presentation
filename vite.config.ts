import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import { fileURLToPath, URL } from 'node:url';

export default defineConfig({
 base: '/moodle-guide-presentation/',
 plugins: [react()],
 resolve:{alias:{'@':fileURLToPath(new URL('./src',import.meta.url))}}
});
