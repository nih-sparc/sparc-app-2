<template>
  <div>
    <breadcrumb
      :breadcrumb="breadcrumb"
      :title="aboutDetailsItem.fields.title"
    />
    <page-hero class="py-24">
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
              :parent-path="aboutDetailsItem.fields.slug"
            />
            <hr v-if="aboutDetailsItem.fields.learnMore.length > 1 && index != aboutDetailsItem.fields.learnMore.length - 1" />
          </div>
        </template>
      </div>
    </div>
  </div>
</template>

<script>
import { pathOr, isEmpty } from 'ramda'
import Breadcrumb from '@/components/Breadcrumb/Breadcrumb.vue'
import LearnMoreCard from '@/components/LearnMoreCard/LearnMoreCard.vue'
import ShareLinks from '~/components/ShareLinks/ShareLinks.vue'

import marked from '@/mixins/marked'

export default {
  name: 'AboutDetailsId',

  components: {
    Breadcrumb,
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

  async setup() {
    const { $contentfulClient } = useNuxtApp()
    const router = useRouter()
    const { params } = useRoute()
    const config = useRuntimeConfig()
    const aboutDetailsItem =
      await $contentfulClient.getEntries({
        content_type: config.public.ctf_about_details_content_type_id,
        'fields.slug': params.aboutDetailsId
      }).then(async ({ items }) => {
        if (items.length == 0) {
          return await $contentfulClient.getEntry(params.aboutDetailsId).then(async (response) => {
            const slug = pathOr("", ['fields', 'slug'], response)
            if (!isEmpty(slug)) {
              await navigateTo(`/about/${slug}`)
            }
            return response
          })
        }
        else {
          return items[0]
        }
      })
    
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
:deep(img) {
  max-width: 100%;
}
</style>
