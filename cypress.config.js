import { defineConfig } from "cypress";
import axios from 'axios'
import randomAssign from './tests/cypress/support/support.js'

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
    async setupNodeEvents(on, config) {
      if (!config.env.PAGE_LIMIT) {
        config.env.PAGE_LIMIT = randomAssign('10, 20, 50, View All', 1);
      }
      if (!config.env.SEARCH_KEYWORDS) {
        config.env.SEARCH_KEYWORDS = randomAssign('Vagus, Spine, Heart, Microscopy, Electrophysiology, Pig', 2);
      }
      if (!config.env.FILTER_FACET) {
        config.env.FILTER_FACET = randomAssign('Central Nervous System, Brain, Human, Connectivity, Male, Adult', 1);
      }
      if (!config.env.MULTIPLE_FILTER_FACETS) {
        config.env.MULTIPLE_FILTER_FACETS = randomAssign('Central Nervous System, Brain, Human, Connectivity, Male, Adult', 2);
      }
      if (!config.env.DATASET_IDS) {
        await axios
          .get(`${config.env.PORTAL_API}/all_dataset_ids`)
          .then((response) => {
            config.env.DATASET_IDS = randomAssign(response.data, 5);
          })
          .catch((error) => {
            console.error('Error:', error.message);
          });
      }
      if (!config.env.TAXON_MODELS) {
        config.env.TAXON_MODELS = randomAssign('Human Female, Human Male, Rat, Mouse, Pig, Cat', 2);
      }
      if (!config.env.THREE_SYNC_VIEW) {
        config.env.THREE_SYNC_VIEW = randomAssign('Human Female, Human Male, Rat', 1);
      }
      if (!config.env.SEARCH_IN_MAP) {
        config.env.SEARCH_IN_MAP = randomAssign('Heart, Lung, Colon, Stomach, Liver', 1);
      }
      if (!config.env.SCAFFOLD_DATASET_IDS) {
        config.env.SCAFFOLD_DATASET_IDS = randomAssign('150, 155, 292, 102, 223', 2);
      }
      return config
    },
    env: {
      PORTAL_API: process.env.PORTAL_API_HOST ? process.env.PORTAL_API_HOST : 'https://sparc-api.herokuapp.com',
      // databrowser.js
      PAGE_LIMIT: process.env.PAGE_LIMIT,
      SEARCH_KEYWORDS: process.env.SEARCH_KEYWORDS,
      FILTER_FACET: process.env.FILTER_FACET,
      MULTIPLE_FILTER_FACETS: process.env.MULTIPLE_FILTER_FACETS,
      // datasets.js
      DATASET_IDS: process.env.DATASET_IDS,
      // mapsviewer.js
      TAXON_MODELS: process.env.TAXON_MODELS,
      THREE_SYNC_VIEW: process.env.THREE_SYNC_VIEW,
      SEARCH_IN_MAP: process.env.SEARCH_IN_MAP,
      SCAFFOLD_DATASET_IDS: process.env.SCAFFOLD_DATASET_IDS,
    }
  },
  fixturesFolder: "tests/cypress/fixtures",
  screenshotsFolder: "tests/cypress/screenshots",
  videosFolder: "tests/cypress/videos",
  downloadsFolder: "tests/cypress/downloads",
});
