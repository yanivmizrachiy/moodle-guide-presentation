import { defineConfig, devices } from '@playwright/test';

/**
 * Real-browser gate for the guide: navigation, two-path branches,
 * flows/hotspots, the edit-mode teaching control, runtime-error and viewport
 * regression (every published slide), accessibility scans and visual
 * regression, on representative desktop and mobile viewports.
 * Runs against the real production build served by vite preview.
 */
export default defineConfig({
  testDir: 'tests/e2e',
  fullyParallel: true,
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 2 : 0,
  reporter: process.env.CI ? [['list'], ['html', { open: 'never' }]] : 'list',
  use: {
    baseURL: 'http://localhost:4173/moodle-guide-presentation/',
    trace: 'retain-on-failure',
    // Motion (motion/react) honors reduced motion, which keeps interactions and
    // screenshots deterministic without changing what users can do.
    contextOptions: { reducedMotion: 'reduce' },
  },
  projects: [
    { name: 'desktop', use: { ...devices['Desktop Chrome'], viewport: { width: 1280, height: 800 } } },
    { name: 'mobile', use: { ...devices['Pixel 5'] } },
  ],
  webServer: {
    command: 'npm run build && npm run preview -- --port 4173 --strictPort',
    url: 'http://localhost:4173/moodle-guide-presentation/',
    reuseExistingServer: !process.env.CI,
    timeout: 120_000,
  },
});
