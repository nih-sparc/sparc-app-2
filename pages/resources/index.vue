<template>
  <div class="resources">
    <breadcrumb :breadcrumb="breadcrumb" :title="title" />
    <page-hero class="py-24">
      <h1>{{ fields.title }}</h1>
      <!-- eslint-disable vue/no-v-html -->
      <!-- marked will sanitize the HTML injected -->
      <div v-html="parseMarkdown(fields.summary)" />
      <NuxtLink to="/resources/databases">
        <el-button class="secondary mb-16">Browse all Tools &amp; Resources</el-button>
      </NuxtLink>
    </page-hero>
    <div class="container">
      <div v-if="fields.featured !== undefined">
        <div class="heading2 my-32">Featured Tools &amp; Resources</div>
        <gallery
          galleryItemType="resources"
          :items="fields.featured"
        />
        <div class="link-container mt-16">
          <NuxtLink class="browse-all-link" to="/resources/databases">
            Browse All Tools &amp; Resources
          </NuxtLink>
        </div>
      </div>
      <div class="pb-16">
        <h2 class="heading2 mt-32">Contribute</h2>
        <paper
          :text="parseMarkdown(fields.paperText)"
          :button-text="'Submit a recommendation'"
          :button-link="{ name: 'contact-us', query: { type: 'tool'} }"
          new-tab
        />
      </div>
    </div>
  </div>
</template>

<script>
import marked from '@/mixins/marked/index'
import Paper from '~/components/Paper/Paper.vue'
import Gallery from '~/components/Gallery/Gallery.vue'

export default {
  name: 'Resources',

  mixins: [marked],

  components: {
    Paper,
    Gallery,
  },

  async setup() {
    const { $contentfulClient } = useNuxtApp()
    const config = useRuntimeConfig()
    const fields = await $contentfulClient
      .getEntry(config.public.ctf_tools_and_resources_page_id)
      .then(({ fields }) => ({ fields }))
      .catch(e => {
        console.log(e)
      })
    useHead({
      title: fields.fields.title,
      meta: [
        {
          hid: 'og:title',
          property: 'og:title',
          content: fields.fields.title,
        },
        {
          hid: 'description',
          name: 'description',
          content: fields.fields.summary ? fields.fields.summary : 'The open community platform for bridging the body and the brain through neuroscience and systems physiology data, computational and spatial modeling, and device design.'
        },
      ]
    })
    return fields
  },

  data() {
    return {
      title: 'Tools & Resources',
      breadcrumb: [
        {
          to: {
            name: 'index',
          },
          label: 'Home',
        },
      ],
    }
  }
}
</script>
<style lang="scss" scoped>
@import 'sparc-design-system-components-2/src/assets/_variables.scss';
.resources {
  background-color: $background;
}
.button-container {
  text-align: center;
}
.browse-all-link {
  text-decoration: underline;
  font-weight: 500;
}
.link-container {
  text-align: center;
}
</style>
