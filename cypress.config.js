import { defineConfig } from "cypress";

export default defineConfig({
  defaultCommandTimeout: 5000,
  experimentalMemoryManagement: true,
  numTestsKeptInMemory: 0,
  retries: 2,
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
    env: {
      // databrowser.js
      BROWSE_CATEGORIES: process.env.BROWSE_CATEGORIES ? process.env.BROWSE_CATEGORIES : 'dataset, model, simulation, projects',
      PAGE_LIMIT: process.env.PAGE_LIMIT ? process.env.PAGE_LIMIT : '20',
      SEARCH_KEYWORDS: process.env.SEARCH_KEYWORDS ? process.env.SEARCH_KEYWORDS : 'Spine, neck',
      FILTER_FACET: process.env.FILTER_FACET ? process.env.FILTER_FACET : 'Human',
      MULTIPLE_FILTER_FACETS: process.env.MULTIPLE_FILTER_FACETS ? process.env.MULTIPLE_FILTER_FACETS : 'Heart, Adult',
      // datasets.js
      DATASET_IDS: process.env.DATASET_IDS ? process.env.DATASET_IDS : '127, 282, 290, 34, 76',
      // mapsviewer.js
      THREE_SYNC_VIEW: process.env.THREE_SYNC_VIEW ? process.env.THREE_SYNC_VIEW : 'Human Male',
      SCAFFOLD_DATASET_IDS: process.env.SCAFFOLD_DATASET_IDS ? process.env.SCAFFOLD_DATASET_IDS : '150, 155',
    }
  },
  fixturesFolder: "tests/cypress/fixtures",
  screenshotsFolder: "tests/cypress/screenshots",
  videosFolder: "tests/cypress/videos",
  downloadsFolder: "tests/cypress/downloads",
});
