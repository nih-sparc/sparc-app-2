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
          additionalData: '@use "sparc-design-system-components-2/dist/style.css" as *;',
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
      zipit_api_host: process.env.ZIPIT_API_HOST || 'https://api.pennsieve.io/zipit/discover',
      CTF_SPACE_ID: process.env.CTF_SPACE_ID,
      CTF_CDA_ACCESS_TOKEN: process.env.CTF_CDA_ACCESS_TOKEN,
      CTF_API_HOST: process.env.CTF_API_HOST || 'preview.contentful.com',
      ctf_home_page_id: '4qJ9WUWXg09FAUvCnbGxBY',
      ctf_footer_copy_id: 'wpik0A2sDOy9IQEoKpkKG',
      ctf_portal_notification_entry_id: 'XiVlrkTXeKxTyN1Q2oY2Q',
      ctf_contact_us_form_options_id: '79rwRA0rUqUj6rc913BFsz',
      ctf_project_id: 'sparcAward',
      ctf_about_page_id: '4VOSvJtgtFv1PS2lklMcnS',
      ctf_about_details_content_type_id: 'aboutPageSecondLevel',
      ctf_news_id: 'news',
      ctf_news_and_events_page_id: '4IoMamTLRlN3OpxT1zgnU',
      ctf_about_portal_page_id: '2156L8jQgaifFNpgeylaQp',
      ctf_what_we_offer_page_id: '4wuZ2gzxota1GLTFUXSLNb',
      ctf_team_and_leadership_page_id: '7EL9Plxo7q2GyCzg1sqIcg',
      ctf_get_involved_page_id: 'jxEBoBw2zUctuDaX2eeX1',
      portal_api: process.env.PORTAL_API_HOST || 'https://sparc-api.herokuapp.com',
      flatmap_api: process.env.FLATMAP_API_HOST || 'https://mapcore-demo.org/current/flatmap/v3/',
      DEPLOY_ENV: process.env.DEPLOY_ENV || 'development',
      ALGOLIA_API_KEY: process.env.ALGOLIA_API_KEY,
      ALGOLIA_APP_ID: process.env.ALGOLIA_APP_ID,
      ALGOLIA_INDEX: process.env.ALGOLIA_INDEX || 'k-core_dev',
      ALGOLIA_INDEX_PUBLISHED_TIME_DESC: process.env.ALGOLIA_INDEX_PUBLISHED_TIME_DESC || 'k-core_dev_published_time_desc',
      ALGOLIA_INDEX_PUBLISHED_TIME_ASC: process.env.ALGOLIA_INDEX_PUBLISHED_TIME_ASC || 'k-core_dev_published_time_asc',
      ALGOLIA_INDEX_ALPHABETICAL_A_Z: process.env.ALGOLIA_INDEX_ALPHABETICAL_A_Z || 'k-core_dev_alphabetical_a_z',
      ALGOLIA_INDEX_ALPHABETICAL_Z_A: process.env.ALGOLIA_INDEX_ALPHABETICAL_Z_A || 'k-core_dev_alphabetical_z_a',
      SHOW_HIERARCHAL_FACETS: process.env.SHOW_HIERARCHAL_FACETS || 'false',
      SHOW_SDS_VIEWER: process.env.SHOW_SDS_VIEWER || 'false',
      SHOW_TIMESERIES_VIEWER: process.env.SHOW_TIMESERIES_VIEWER || 'false',
      METACELL_SDS_VIEWER_URL: process.env.METACELL_SDS_VIEWER_URL || 'https://metacell.github.io/sds-viewer',
      ORCID_API_URL: process.env.ORCID_API_URL || 'https://pub.orcid.org/v2.1',
      crosscite_api_host: process.env.CROSSCITE_API_HOST || 'https://citation.crosscite.org',
      max_download_size: parseInt(process.env.MAX_DOWNLOAD_SIZE || '5000000000'),
      osparc_host: process.env.OSPARC_HOST || 'https://osparc.io',
      MBF_SPARC_API: process.env.MBF_SPARC_API || 'https://mbfsparcapi.com',
      BL_API_URL: 'https://sparc.biolucida.net/api/v1/',
      BL_SERVER_URL: 'https://sparc.biolucida.net',
      BL_SHARE_LINK_PREFIX: 'https://sparc.biolucida.net/image?c=',
      NL_LINK_PREFIX: 'https://sparc.biolucida.net:8081',
      ROOT_URL: process.env.ROOT_URL || 'http://localhost:3000',
      METRICS_URL: process.env.METRICS_URL || 'https://metrics.sparc.science',
      BITLY_ACCESS_TOKEN: process.env.BITLY_ACCESS_TOKEN,
      bitly_expand_endpoint: 'https://api-ssl.bitly.com/v4/expand'
    }
  },
  /*
  ** Global CSS
  */
  css: ['sparc-design-system-components-2/dist/style.css', '@/assets/_base.scss'],
})
