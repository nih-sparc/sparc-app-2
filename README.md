# Nuxt 3 Minimal Starter

Look at the [Nuxt 3 documentation](https://nuxt.com/docs/getting-started/introduction) to learn more.

## Setup

1. Make sure to install the dependencies:

```bash
yarn install
```

2. Make sure to set any un-set environment variables found in the nuxt.config file

## Development Server

Start the development server on `http://localhost:3000`:

```bash
# yarn
yarn dev
```

## Production

Build the application for production:

```bash
# yarn
yarn build
```

Locally preview production build:

```bash
# yarn
yarn preview
```

Check out the [deployment documentation](https://nuxt.com/docs/getting-started/deployment) for more information.

## Testing

Export the following environment variables for Cypress:

```bash
# testing target, default http://localhost:3000
export ROOT_URL=
# recording require
export CYPRESS_PROJECT_ID=
export CYPRESS_RECORD_KEY=
# parallel require
export CI_BUILD_ID=
```

Run Cypress E2E tests for portal:

```bash
# Run all tests locally
yarn cypress
# Open the Cypress UI (for adding/editing/debugging tests)
yarn cypress-ui
# -record to record in Cypress Cloud
# -parallel to run in parallel (requires several terminals)
yarn cypress-record
yarn cypress-record-parallel
```
