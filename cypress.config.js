import { defineConfig } from "cypress";

export default defineConfig({
  defaultCommandTimeout: 5000,
  experimentalMemoryManagement: true,
  numTestsKeptInMemory: 0,
  e2e: {
    baseUrl: process.env.ROOT_URL ? process.env.ROOT_URL : 'http://localhost:3000',
    experimentalStudio: true,
    projectId: process.env.CYPRESS_PROJECT_ID,
    specPattern: "tests/cypress/e2e/**/*.cy.{js,jsx,ts,tsx}",
    supportFile: "tests/cypress/support/e2e.js",
    viewportWidth: 1600,
    viewportHeight: 900,
    //Prevent huge amount of time on reloading page
    testIsolation: true,
    // pageLoadTimeout: 1024*1024*1024,
    setupNodeEvents(on, config) {
      // implement node event listeners here
    },
  },
  fixturesFolder: "tests/cypress/fixtures",
  screenshotsFolder: "tests/cypress/screenshots",
  videosFolder: "tests/cypress/videos",
  downloadsFolder: "tests/cypress/downloads",
});
