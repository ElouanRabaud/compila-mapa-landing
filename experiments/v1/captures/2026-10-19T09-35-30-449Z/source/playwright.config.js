import { defineConfig } from '@playwright/test';
export default defineConfig({
  testDir: './tests/browser', fullyParallel: false, workers: 1,
  use: { baseURL: 'http://127.0.0.1:8790', headless: true },
  webServer: { command: 'node scripts/preview.mjs', env: { PREVIEW_PORT: '8790', REGISTRATION_ENABLED: 'false', MAILCHIMP_API_KEY: '' }, url: 'http://127.0.0.1:8790', reuseExistingServer: false, timeout: 15000 },
  reporter: 'list'
});
