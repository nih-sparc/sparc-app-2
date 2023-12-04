// https://nuxt.com/docs/api/configuration/nuxt-config
import { resolve } from 'pathe'

export default defineNuxtConfig({
  app: {
    head: {
      title: 'SPARC Portal',
      meta: [
        { charset: 'utf-8' },
        { name: 'viewport', content: 'width=device-width, initial-scale=1' },
        {
          hid: 'description',
          name: 'description',
          content: 'Stimulating Peripheral Activity to Relieve Conditions (SPARC)',
        },
        {
          hid: 'keywords',
          name: 'keywords',
          content: 'nih sparc, sparc program, stimulating peripheral activity to relieve conditions, common fund sparc, sparc, sparc initiative, sparc neuro, sparc science'
        },
        // default social cards information for site sharing url's
        { hid: 'og:type', property: 'og:type', content: 'website' },
        { hid: 'og:title', property: 'og:title', content: 'SPARC Portal' },
        { hid: 'og:description', property: 'og:description', content: 'Stimulating Peripheral Activity to Relieve Conditions (SPARC)' },
        { hid: 'og:image', property: 'og:image',
          content: 'https://images.ctfassets.net/6bya4tyw8399/7r5WTb92QnHkub8RsExuc1/2ac134de2ddfd65eb6316421df7578f9/sparc-logo-primary.png'
        },
        { hid: 'og:image:secure_url', property: 'og:image:secure_url',
          content: 'https://images.ctfassets.net/6bya4tyw8399/7r5WTb92QnHkub8RsExuc1/2ac134de2ddfd65eb6316421df7578f9/sparc-logo-primary.png'
        },
        { hid: 'og:url', property: 'og:url', content: process.env.ROOT_URL || 'sparc.science' },
        { hid: 't-type', name: 'twitter:card', content: 'summary_large_image' },
        { name: 'twitter:site', content: '@sparc_science' },
        { name: 'twitter:title', content: 'SPARC Portal' },
        { name: 'twitter:image', content: 'https://images.ctfassets.net/6bya4tyw8399/7r5WTb92QnHkub8RsExuc1/2ac134de2ddfd65eb6316421df7578f9/sparc-logo-primary.png' },
        { name: 'twitter:description', content: 'Stimulating Peripheral Activity to Relieve Conditions (SPARC)' }
      ],
      link: [
        {
          rel: 'icon',
          type: 'image/x-icon',
          href: '/favicon/favicon.ico'
        },
        {
          rel: 'stylesheet',
          href:
            'https://fonts.googleapis.com/css?family=Asap:400,400i,500,600,700&display=swap'
        }
      ]
    }
  },
  devtools: { enabled: true },
  modules: [
    '@element-plus/nuxt',
    'nuxt-svgo',
    '@pinia/nuxt',
    '@pinia-plugin-persistedstate/nuxt'
  ],
  /*vite: {
    css: {
      preprocessorOptions: {
        scss: {
          additionalData: `@use "@/assets/scss/element/index.scss" as element;`,
        },
      },
    },
  },*/
  hooks: {
    'pages:extend'(pages) {
      pages.push(
        {
            name: 'version',
            path: '/datasets/:datasetId/version/:version',
            file: resolve('./pages/datasets/[datasetId].vue')
        }
      )
    }
  },
  runtimeConfig: {
    public: {
      discover_api_host: process.env.PENNSIEVE_DISCOVER_API_HOST || 'https://api.pennsieve.io/discover',
      ctf_home_page_id: '4qJ9WUWXg09FAUvCnbGxBY',
      ctf_footer_copy_id: 'wpik0A2sDOy9IQEoKpkKG',
      ctf_portal_notification_entry_id: 'XiVlrkTXeKxTyN1Q2oY2Q',
      ctf_contact_us_form_options_id: '79rwRA0rUqUj6rc913BFsz',
      ctf_project_id: 'sparcAward',
      portal_api: process.env.PORTAL_API_HOST || 'https://sparc-api.herokuapp.com',
      CTF_SPACE_ID: process.env.CTF_SPACE_ID,
      CTF_CDA_ACCESS_TOKEN: process.env.CTF_CDA_ACCESS_TOKEN,
      CTF_API_HOST: process.env.CTF_API_HOST || 'preview.contentful.com',
      DEPLOY_ENV: process.env.DEPLOY_ENV || 'development',
      ALGOLIA_API_KEY: process.env.ALGOLIA_API_KEY,
      ALGOLIA_APP_ID: process.env.ALGOLIA_APP_ID,
      ALGOLIA_INDEX: process.env.ALGOLIA_INDEX || 'k-core_dev',
      ALGOLIA_INDEX_PUBLISHED_TIME_DESC: process.env.ALGOLIA_INDEX_PUBLISHED_TIME_DESC || 'k-core_dev_published_time_desc',
      ALGOLIA_INDEX_PUBLISHED_TIME_ASC: process.env.ALGOLIA_INDEX_PUBLISHED_TIME_ASC || 'k-core_dev_published_time_asc',
      ALGOLIA_INDEX_ALPHABETICAL_A_Z: process.env.ALGOLIA_INDEX_ALPHABETICAL_A_Z || 'k-core_dev_alphabetical_a_z',
      ALGOLIA_INDEX_ALPHABETICAL_Z_A: process.env.ALGOLIA_INDEX_ALPHABETICAL_Z_A || 'k-core_dev_alphabetical_z_a',
      SHOW_HIERARCHAL_FACETS: process.env.SHOW_HIERARCHAL_FACETS || 'false',
      METACELL_SDS_VIEWER_URL: process.env.METACELL_SDS_VIEWER_URL || 'https://metacell.github.io/sds-viewer',
      ORCID_API_URL: process.env.ORCID_API_URL || 'https://pub.orcid.org/v2.1',
      crosscite_api_host: process.env.CROSSCITE_API_HOST || 'https://citation.crosscite.org',
    }
  },
  /*
  ** Global CSS
  */
  css: ['sparc-design-system-components-2/dist/style.css'],
})
