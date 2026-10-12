import { defineConfig, devices } from '@playwright/test'

// Playwright is used (instead of Cypress) for tests that need the page to be cross-origin isolated:
// Cypress runs the app inside an iframe, so crossOriginIsolated is always false there.
export default defineConfig({
  testDir: 'tests/playwright',
  outputDir: 'tests/playwright/results',
  timeout: 120000,
  retries: process.env.CI ? 2 : 0,
  reporter: process.env.CI ? 'github' : 'list',
  metadata: {
    SIMULATION_FILE_URL: process.env.SIMULATION_FILE_URL
      ? process.env.SIMULATION_FILE_URL
      : '/datasets/file/135/8?path=files/primary/simulation.omex',
  },
  use: {
    baseURL: process.env.ROOT_URL ? process.env.ROOT_URL : 'http://localhost:3000',
    trace: 'retain-on-failure',
  },
  projects: [
    // WebKit doesn't support COEP `credentialless`
    { name: 'webkit', use: { ...devices['Desktop Safari'] } },
    { name: 'chromium', use: { ...devices['Desktop Chrome'] } },
  ],
})
