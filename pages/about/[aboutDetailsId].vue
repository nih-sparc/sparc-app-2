<template>
  <div>
    <breadcrumb
      :breadcrumb="breadcrumb"
      :title="aboutDetailsItem.fields.title"
    />
    <page-hero>
      <h1>{{ aboutDetailsItem.fields.title }}</h1>
      <p>{{ aboutDetailsItem.fields.summary }}</p>
    </page-hero>
    <div class="container">
      <div class="subpage">
        <div v-html="parseMarkdown(aboutDetailsItem.fields.description)" />
        <hr />
        <p class="share-text">
          SHARE
        </p>
        <share-links />
      </div>
      <div v-if="aboutDetailsItem.fields.learnMore" class="subpage">
        <h1 class="heading1 mb-16">Learn More</h1>
        <template v-for="(item, index) in aboutDetailsItem.fields.learnMore" :key="item + index">
          <div>
            <learn-more-card
              :about-details-item="item"
              :parent-path="slug"
            />
            <hr v-if="aboutDetailsItem.fields.learnMore.length > 1 && index != aboutDetailsItem.fields.learnMore.length - 1" />
          </div>
        </template>
      </div>
    </div>
  </div>
</template>

<script>
import Breadcrumb from '@/components/Breadcrumb/Breadcrumb.vue'
import LearnMoreCard from '@/components/LearnMoreCard/LearnMoreCard.vue'
import PageHero from '@/components/PageHero/PageHero.vue'
import ShareLinks from '~/components/ShareLinks/ShareLinks.vue'

import marked from '@/mixins/marked'

import { successMessage, failMessage } from '@/utils/notification-messages'

export default {
  name: 'AboutDetailsId',

  components: {
    Breadcrumb,
    PageHero,
    LearnMoreCard,
    ShareLinks
  },

  mixins: [marked],

  data: () => ({
    aboutDetailsItem: null,
    heroCopy: '',
    copy: '',
    breadcrumb: [
      {
        to: {
          name: 'index'
        },
        label: 'Home'
      },
      {
        label: 'About SPARC',
        to: {
          name: 'about'
        }
      }
    ]
  }),

  setup() {
    const { $contentfulClient } = useNuxtApp()
    const { params } = useRoute()
    if (params.aboutDetailsId == 'metrics') {
      // TODO redirect
      // redirect({
      //   name: `about-metrics`
      // })
    }
    const isSlug = params.aboutDetailsId.split('-').length > 1
    const promise = isSlug ?
      $contentfulClient.getEntries({
        content_type: process.env.ctf_about_details_content_type_id,
        'fields.slug': id
      }) :
      $contentfulClient.getEntry(params.aboutDetailsId)
    return promise
      .then(response => {
        return isSlug ? response.items[0] : response
      })
      .then(aboutDetailsItem => {
        if (aboutDetailsItem.fields.slug && params.entryId !== aboutDetailsItem.fields.slug) {
          // TODO redirect
          // redirect({
          //   name: `about-${slug}`
          // })
        }
        useSeoMeta({
          title: aboutDetailsItem.fields.title,
          meta: [
            {
              hid: 'og:title',
              property: 'og:title',
              content: aboutDetailsItem.fields.title,
            },
          ]
        })
        return { aboutDetailsItem }
      })
      .catch(err => console.error('Could not retreive about details.', err))
  }
}
</script>

<style scoped lang="scss">
@import 'sparc-design-system-components-2/src/assets/_variables.scss';
.subpage {
  margin: 1em 0;
  padding: 1em;
  border: 1px solid #dcdfe6;
  background: white;
  @media (min-width: 48em) {
    margin: 2.5em 0;
    padding: 1em 2em;
  }
  hr {
    opacity: 0.3;
  }
  h1 {
    font-weight: 300;
  }
}

.share-text {
  font-weight: 500;
  margin-bottom: 0;
}
</style>
