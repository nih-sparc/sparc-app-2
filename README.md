# EPILEPSY.SCIENCE WEB APPLICATION
This is the repository for the Epilepsy.Science Web Application. The application is build using [Nuxt.js](https://nuxtjs.org) and [Vue.js](https://vuejs.org/).

# Nuxt 3 Minimal Starter

Look at the [Nuxt 3 documentation](https://nuxt.com/docs/getting-started/introduction) to learn more.

## Setup

1. Make sure to install the dependencies:

```bash
yarn install
```

2. Make sure to set any un-set environment variables found in the nuxt.config file

## Important Note on Running Locally

Ensure that the following configuration variables are set in your environment prior to running (values can be obtained once you are given access to epilepsy.science developer apps on Heroku):
* ALGOLIA_API_KEY
* ALGOLIA_APP_ID
* ALGOLIA_INDEX
* CTF_SPACE_ID
* CTF_CDA_ACCESS_TOKEN
* CTF_API_HOST
* DEPLOY_ENV
* PORTAL_API_HOST
* AWS_USER_POOL_WEB_CLIENT_ID
* RECAPTCHA_SECRET_KEY
* RECAPTCHA_SITE_KEY

Add your env vars to `env_var_set.sh` and then run `source env_var_set.sh`
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
