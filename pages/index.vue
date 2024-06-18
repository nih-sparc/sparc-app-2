<template>
  <div class="page-data">
    <page-hero>
      <h1 v-if="heroHeading">
        {{ heroHeading }}
      </h1>
      <!-- eslint-disable vue/no-v-html -->
      <!-- marked will sanitize the HTML injected -->
      <div v-html="parseMarkdown(heroCopy)" />
      <template v-slot:image>
        <img
          v-if="heroImage"
          class="page-hero-img"
          :src="heroImage.fields?.file.url"
        />
      </template>
    </page-hero>
    <div class="secondary-background">
      <sparc-numbers :explore-data="exploreData"/>
    </div>
    <hr />
    <portal-features :features="portalFeatures" />
    <hr />
    <div class="secondary-background">
      <featured-data :featured-data="featuredData" />
    </div>
    <hr />
    <projects-and-datasets :datasetSectionTitle="datasetSectionTitle" :projectOrResource="featuredProject" :dataset="featuredDataset" />
    <hr />
    <div class="secondary-background">
      <homepage-news :news="newsAndEvents" />
    </div>
    <hr />
    <stay-connected />
    <hr />
  </div>
</template>

<script>
import FeaturedData from '@/components/FeaturedData/FeaturedData.vue'
import SparcNumbers from '@/components/SparcNumbers/SparcNumbers.vue'
import HomepageNews from '@/components/HomepageNews/HomepageNews.vue'
import PortalFeatures from '@/components/PortalFeatures/PortalFeatures.vue'
import ProjectsAndDatasets from '@/components/ProjectsAndDatasets/ProjectsAndDatasets.vue'
import StayConnected from '@/components/StayConnected/StayConnected.vue'

import marked from '@/mixins/marked/index'
import getHomepageFields from '@/utils/homepageFields'
import { useMainStore } from '../store/index.js'
import { mapState } from 'pinia'
import { clone, pathOr } from 'ramda'

export default {
  name: 'SparcHomepage',

  components: {
    FeaturedData,
    SparcNumbers,
    HomepageNews,
    PortalFeatures,
    ProjectsAndDatasets,
    StayConnected
  },

  mixins: [marked],

  async setup() {
    const config = useRuntimeConfig()
    const { $contentfulClient, $axios } = useNuxtApp()
    useHead({
      title: 'SPARC Portal',
      meta: [
        {
          hid: 'description',
          name: 'description',
          content:
            'The open community platform for bridging the body and the brain through neuroscience and systems physiology data, computational and spatial modeling, and device design.'
        },
        {
          name: 'og:type',
          content: 'website'
        },
        {
          hid: 'og:title',
          property: 'og:title',
          content: 'SPARC Portal'
        },
        {
          hid: 'og:image',
          property: 'og:image',
          content: 'https://images.ctfassets.net/6bya4tyw8399/7r5WTb92QnHkub8RsExuc1/2ac134de2ddfd65eb6316421df7578f9/sparc-logo-primary.png'
        },
        {
          hid: 'og:image:secure_url', property: 'og:image:secure_url',
          content: 'https://images.ctfassets.net/6bya4tyw8399/7r5WTb92QnHkub8RsExuc1/2ac134de2ddfd65eb6316421df7578f9/sparc-logo-primary.png'
        },
        {
          name: 'og:site_name',
          content: 'SPARC Portal'
        },
        {
          name: 'twitter:card',
          content: 'summary'
        },
        {
          name: 'twitter:site',
          content: '@sparc_science'
        },
        {
          name: 'twitter:title',
          content: 'SPARC Portal'
        },
        {
          name: 'twitter:image',
          content: 'https://images.ctfassets.net/6bya4tyw8399/7r5WTb92QnHkub8RsExuc1/2ac134de2ddfd65eb6316421df7578f9/sparc-logo-primary.png'
        },
        {
          name: 'twitter:description',
          content: 'The open community platform for bridging the body and the brain through neuroscience and systems physiology data, computational and spatial modeling, and device design.'
        }
      ]
    })
    return Promise.all([
      $contentfulClient.getEntry(config.public.ctf_home_page_id)
    ]).then(async ([homepage]) => {
      let fields = getHomepageFields(homepage.fields)
      const datasetSectionTitle = homepage.fields.datasetSectionTitle
      const url = `${config.public.portal_api}/get_featured_dataset`
      await $axios.get(url).then(({data}) => {
        const datasets = data?.datasets
        fields = { ...fields, 'featuredDataset': { 'title': datasets[0].name, 'description': datasets[0].description, 'banner': datasets[0].banner, 'id': datasets[0].id }, 'datasetSectionTitle': datasetSectionTitle }
      })
      if (pathOr(undefined, ["featuredProject","fields","institution"], fields) != undefined) {
        const institutionId = pathOr("", ["featuredProject","fields","institution","sys","id"], fields)
        await $contentfulClient.getEntry(institutionId).then(( response ) => {
          fields.featuredProject.fields = { ...fields.featuredProject.fields, 'banner': response.fields.logo.fields?.file.url }
        })
      }
      return fields
    }).catch(e => {
      console.error(e);
      return { contentfulError: true }
    })
  },
  
  watch: {
    profileComplete: {
      handler: function () {
        if (this.userProfile && !this.profileComplete) {
          this.$router.push("/welcome")
        }
      },
      immediate: true
    },
  },

  computed: {
    ...mapState(useMainStore, ['profileComplete', 'userProfile']),
  },

  beforeMount() {
    // When trying to do federated sign in using a middleware (like we do for sign out), Cognito's callback would only
    // execute client-side (after the middleware had already redirected to the new page) causing it to overwrite the 
    // previous redirect. This issue was supposed to be addressed by https://github.com/aws-amplify/amplify-js/pull/3588, 
    // but attempting to handle dynamic routing after amplify federated sign in via a custom state hook as suggested 
    // here: https://github.com/aws-amplify/amplify-js/issues/3125#issuecomment-814265328 did not work
    const signInRedirectCookie = useCookie('sign-in-redirect-url')
    if (signInRedirectCookie.value != null) {
      const signInRedirectUrl = clone(signInRedirectCookie.value)
      signInRedirectCookie.value = null
      return navigateTo(signInRedirectUrl)
    }
  },

  data: () => {
    return {
      featuredData: [],
      exploreData: [],
      newsAndEvents: [],
      portalFeatures: [],
      featuredProject: {},
      datasetSectionTitle: '',
      featuredDataset: {},
      heroCopy: '',
      heroHeading: '',
      heroImage: {}
    }
  },
}
</script>

<style lang="scss" scoped>
@import 'sparc-design-system-components-2/src/assets/_variables.scss';
.page-data {
  background-color: #f8faff;
}
.secondary-background {
  background-color: $background;
}
.page-hero-video {
  width: 406px;
}

hr {
  margin: 0;
  padding: 0;
  border-top: none;
  border-color: $lineColor1;
}
</style>
