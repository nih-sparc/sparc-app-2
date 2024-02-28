<template>
  <div class="about-page pb-16">
    <breadcrumb :breadcrumb="breadcrumb" title="About SPARC" />
    <page-hero class="py-24" v-if="heroCopy">
      <h1>{{ pageTitle }}</h1>
      <div v-html="parseMarkdown(heroCopy)" />
    </page-hero>
    <div class="container">
      <paper
        class="row mt-32"
        :text="parseMarkdown(sparcPortal)"
        button-text="View The Roadmap"
        button-link-external="https://docs.sparc.science/docs/sparc-portal-roadmap"
      />
      <div class="row mt-32">
        <paper
          class="row-item"
          :text="parseMarkdown(whatWeOffer)"
          :button-text="' What We Offer '"
          :button-link="aboutLink(whatWeOfferPageId)"
        />
        <paper
          class="row-item"
          :text="parseMarkdown(teamLeadership)"
          :button-text="' Who We Are '"
          :button-link="aboutLink(teamAndLeadershipPageId)"
        />
        <paper
          class="row-item"
          :text="parseMarkdown(getInvolved)"
          :button-text="' Help Us Grow '"
          :button-link="aboutLink(getInvolvedPageId)"
        />
      </div>

      <div class="gallery-items-container p-32 mt-32">
        <div class="heading2 mb-16">Portal Metrics</div>
        <gallery
          galleryItemType="metrics"
          :items="metricsItems"
        />
        <nuxt-link
          to="/about/metrics"
        >
          <el-button class="secondary mt-16">
            View All Metrics
          </el-button>
        </nuxt-link>
      </div>

      <div class="gallery-items-container p-32 mt-32">
        <div class="heading2 mb-16">Highlights</div>
        <gallery
          galleryItemType="highlights"
          :cardWidth="68"
          :items="highlights"
        />
      </div>

      <div class="gallery-items-container p-32 mt-32">
        <div
          class="about-page-text"
          v-html="parseMarkdown(overview)"
        />
      </div>
    </div>
  </div>
</template>

<script>
import Paper from '~/components/Paper/Paper.vue'
import Gallery from '~/components/Gallery/Gallery.vue'

import marked from '@/mixins/marked'
import { getPreviousMonth } from '@/utils/common'

export default {
  name: 'AboutPage',

  components: {
    Paper,
    Gallery
  },

  mixins: [marked],

  data: () => {
    const config = useRuntimeConfig()
    return {
      heroCopy: '',
      copy: '',
      breadcrumb: [
        {
          to: {
            name: 'index'
          },
          label: 'Home'
        }
      ],
      metricsItems: [],
      highlights: [],
      projectId: config.public.ctf_project_id,
      heroImage: {},
      futurePlans: '',
      aboutPortalPageId: config.public.ctf_about_portal_page_id,
      whatWeOfferPageId: config.public.ctf_what_we_offer_page_id,
      teamAndLeadershipPageId: config.public.ctf_team_and_leadership_page_id,
      getInvolvedPageId: config.public.ctf_get_involved_page_id,
      contentfulError: false
    }
  },

  setup() {
    const config = useRuntimeConfig()
    const { $contentfulClient, $axios } = useNuxtApp()
    const today = new Date()
    const day = today.getDate().toString().padStart(2, "0")
    let month = today.getMonth() + 1
    month = month.toString().padStart(2, "0")
    const year = today.getFullYear()
    return Promise.all([
      /**
       * Page data
       */
      $contentfulClient
        .getEntry(config.public.ctf_about_page_id)
        .then(({fields}) => {
          useSeoMeta({
            title: fields.pageTitle,
            meta: [
              {
                hid: 'og:title',
                property: 'og:title',
                content: fields.pageTitle,
              },
              {
                hid: 'description',
                name: 'description',
                content: fields.heroCopy ? fields.heroCopy : 'The open community platform for bridging the body and the brain through neuroscience and systems physiology data, computational and spatial modeling, and device design.'
              },
            ]
          })
          return fields
        })
        .catch(err => console.error('Could not fetch page data from Contentful.', err)),
      /**
       * Metrics
       */
      $axios
        .get(config.public.METRICS_URL + `/pennsieve?year=${year}&month=${month}`)
        .then(({ data }) => {
          const metrics = data[0]
          return {
            totalContributors: parseInt(metrics['number_of_sparc_users_overall']['N']),
            newContributors: parseInt(metrics['number_of_new_sparc_users_last_quarter']['N']),
            downloadsLastMonth: parseInt(metrics['number_of_sparc_downloads_last_mo']['N'])
          }
        })
        .catch(() => {
          const lastMonthsDate = getPreviousMonth()
          return $axios
            .get(config.public.METRICS_URL + `/pennsieve?year=${lastMonthsDate.year}&month=${lastMonthsDate.month}`)
            .then(({ data }) => {
              const metrics = data[0]
              return {
                totalContributors: parseInt(metrics['number_of_sparc_users_overall']['N']),
                newContributors: parseInt(metrics['number_of_new_sparc_users_last_quarter']['N']),
                downloadsLastMonth: parseInt(metrics['number_of_sparc_downloads_last_mo']['N'])
              }
            })
            .catch(err => {
              console.error('Could not retreive metrics: ', err)
            })
        }),
      /**
       * Download count
       */
      $axios
        .get(config.public.discover_api_host + `/metrics/dataset/downloads/summary?startDate=2020-01-01&endDate=${year}-${month}-${day}`)
        .then(response => {
          let totalDownloads = 0
          response.data.forEach(item => {
            if (item.origin === 'SPARC') {
              totalDownloads += parseInt(item['downloads'])
            }
          })
          return totalDownloads
        })
        .catch(err => console.log('Error retreiving download count.', err)),
      /**
       * Highlights
       */
      $contentfulClient.getEntries({
        'content_type': config.public.ctf_news_id,
        order: '-fields.publishedDate',
        limit: '999',
        'fields.subject': 'Highlight'
      })
        .then(({ items }) => items)
        .catch(err => {
          console.log('Could not retrieve highlights.', err)
        })
    ]).then(([cfPage, metrics={}, totalDownloads, highlights]) => ({
      ...cfPage,
      highlights,
      metricsItems: [{
        title: 'Total Downloads',
        data: totalDownloads.toString(),
        subData: `(${metrics.downloadsLastMonth} last month)`
      }, {
        title: 'Dataset Contributors',
        data: metrics.totalContributors.toString(),
        subData: `(${metrics.newContributors} new in the last month)`
      }]
    }))
  },

  methods: {
    /**
     * Compute the link to the help article
     * This will use the slug if available, and fallback
     * to the ID of the entry if not
     * @returns {Object}
     */
    aboutLink(aboutDetailsId) {
      const name = 'about-aboutDetailsId'
      return { name, params: { aboutDetailsId } }
    }
  }
}
</script>

<style scoped lang="scss">
@import 'sparc-design-system-components-2/src/assets/_variables.scss';
.about-page {
  background-color: $background;
}

.row-item {
  width: 30%;
  display: flex;
  @media screen and (max-width: 767px) {
    width: 100%;
  }
}

.row {
  display: flex;
  justify-content: space-between;
  @media screen and (max-width: 767px) {
    flex-direction: column;
  }
}

.portal-image {
  height: auto;
  width: 30%;
  min-width: 20rem;

  @media screen and (max-width: 767px) {
    display: none;
  }
}

.margin-top-auto {
  margin-top: auto;
}

.midnightblue-background {
  background-color: $darkBlue;
}

.white-text {
  color: white;
}

.about-page-border {
  border: 1px solid $lineColor2;
}
.gallery-items-container {
  background-color: white;
  border: 1px solid $lineColor1;
}
</style>
