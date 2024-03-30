<template>
  <div>
    <breadcrumb :breadcrumb="breadcrumb" :title="title" />
    <page-hero class="py-24">
      <h1>{{ title }}</h1>
      <p>
        {{ description }}
      </p>
    </page-hero>
    <portal-features :features="appEntries" :title="appsSectionTitle" :icon-is-top-element="false" :max-per-row="3" />
    <div class="container" :style="'text-align: center; margin-top: 1rem;'" v-html="parseMarkdown(footer)" />
  </div>
</template>

<script>
import PortalFeatures from '@/components/PortalFeatures/PortalFeatures.vue'
import MarkedMixin from '@/mixins/marked'
import { pathOr, propOr } from 'ramda'

const constructPortalFeatureEntries = (apps) => {
  if (apps == undefined) {
    return []
  }
  let entries = []
  apps.forEach(app => {
    const appEntry = {
      fields: {
        buttonLink: pathOr('', ['fields','url'], app),
        buttonText: pathOr('', ['fields', 'buttonText'], app),
        description: pathOr('', ['fields', 'description'], app),
        title: pathOr('', ['fields', 'name'], app),
        icon: {
          fields: {
            file: {
              url: pathOr('', ['fields', 'logo', 'fields', 'file', 'url'], app),
            },
          },
        },
      }
    }
    entries.push(
      appEntry
    )
  })
  return entries
}

export default {
  name: 'AppsPage',
  components: {
    PortalFeatures
  },
  mixins: [MarkedMixin],
  async setup() {
    const config = useRuntimeConfig()
    const { $contentfulClient } = useNuxtApp()
    try {
      const appPage = await $contentfulClient.getEntry(config.public.ctf_apps_page_id)
      const appEntries = constructPortalFeatureEntries(appPage.fields?.apps)

      useHead({
        title: appPage.fields.title,
        meta: [
          {
            hid: 'og:title',
            property: 'og:title',
            content: appPage.fields.title,
          },
          {
            hid: 'description',
            name: 'description',
            content: appPage.fields.description ? appPage.fields.description : 'The open community platform for bridging the body and the brain through neuroscience and systems physiology data, computational and spatial modeling, and device design.'
          },
        ]
      })
      return {
        appEntries,
        fields: appPage.fields,
      }
    } catch (e) {
      console.error(e)
    }
  },

  data() {
    return {
      breadcrumb: [
        {
          to: {
            name: 'index'
          },
          label: 'Home'
        }
      ]
    }
  },

  computed: {
    title: function () {
      return this.fields.title
    },
    description: function () {
      return this.fields.description
    },
    appsSectionTitle: function () {
      return propOr('', 'appsSectionTitle', this.fields)
    },
    footer: function () {
      return propOr('', 'footerText', this.fields)
    }
  }
}
</script>

<style lang="scss" scoped>
@import 'sparc-design-system-components-2/src/assets/_variables.scss';

</style>
