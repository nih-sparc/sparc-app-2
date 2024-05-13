<template>
  <div :style="consortiaStyle" class="pb-32">
    <breadcrumb :breadcrumb="breadcrumb" :title="title" />
    <div class="container pt-32">
      <paper class="row" :text="parseMarkdown(overview)" :logoSrc="logoUrl" />
      <div class="row mt-32">
        <paper class="row-item" :text="parseMarkdown(whoWeAre)" :button-text="whoWeAreButtonText"
          :button-link="whoWeAreButtonLink" />
        <!--<paper class="row-item" :text="parseMarkdown(whatWeDo)" :button-text="whatWeDoButtonText"
          :button-link="whatWeDoButtonLink" />-->
        <paper class="row-item" :text="parseMarkdown(ourResearch)" :button-text="ourResearchButtonText"
          :button-link="ourResearchButtonLink" />
      </div>
      <div v-if="featuredDataset?.title" class="featured-dataset-container p-16 mt-32">
        <div class="mb-16">Here is a dataset you might be interested in:</div>
        <projects-and-datasets-card :title="featuredDataset.title" :description="featuredDataset.description"
          :banner="featuredDataset.banner" :link="featuredDatasetLink" button-text="View Dataset" />
      </div>
      <div v-if="highlights.length > 0" class="gallery-items-container p-32 mt-32">
        <div class="heading1 mb-16">Highlights</div>
        <gallery galleryItemType="highlights" :cardWidth="68" :items="highlights" />
      </div>
    </div>
  </div>
</template>

<script>
import { ref } from 'vue'
import Paper from '~/components/Paper/Paper.vue'
import Gallery from '~/components/Gallery/Gallery.vue'
import ProjectsAndDatasetsCard from '~/components/ProjectsAndDatasets/ProjectsAndDatasetsCard/ProjectsAndDatasetsCard.vue'

import marked from '@/mixins/marked'
import { pathOr, propOr, isEmpty } from 'ramda'

export default {
  name: 'ConsortiaPage',

  components: {
    Paper,
    Gallery,
    ProjectsAndDatasetsCard
  },

  mixins: [marked],

  data: () => {
    return {
      breadcrumb: [
        {
          to: {
            name: 'index'
          },
          label: 'Home'
        },
        {
          label: 'About',
          to: {
            name: 'about'
          }
        }
      ]
    }
  },

  async setup() {
    const config = useRuntimeConfig()
    const { $contentfulClient, $pennsieveApiClient } = useNuxtApp()
    const { params } = useRoute()
    let contentfulError = false
    const consortiaItem =
      await $contentfulClient.getEntries({
        content_type: config.public.ctf_consortia_content_type_id,
        'fields.slug': params.id.toLowerCase()
      }).then(response => {
        return propOr([], 'items', response)[0]
      }).catch(e => {
        contentfulError = true
      })
    let featuredDataset = {}
    const featuredId = pathOr('', ['fields', 'datasetId'], consortiaItem)
    if (!isEmpty(featuredId)) {
      const pennsieveDatasetUrl = `${config.public.discover_api_host}/datasets/${featuredId}`
      await $pennsieveApiClient.value.get(pennsieveDatasetUrl).then(({ data }) => {
        featuredDataset = { 'title': data.name, 'description': data.description, 'banner': data.banner, 'id': data.id }
      }).catch(() => {
        featuredDataset = {}
      })
    }
    let highlights = ref([])
    $contentfulClient.getEntries({
      'content_type': config.public.ctf_news_id,
      order: '-fields.publishedDate',
      limit: '999',
      'fields.consortiaHighlight[in]': consortiaItem.fields.title
    }).then(({ items }) => {
      highlights.value = items
    }).catch(() => {
      highlights.value = []
    })
    useSeoMeta({
      title: consortiaItem.fields.title,
      meta: [
        {
          hid: 'og:title',
          property: 'og:title',
          content: consortiaItem.fields.title,
        },
        {
          hid: 'description',
          name: 'description',
          content: consortiaItem.fields.overview ? consortiaItem.fields.overview : 'The open community platform for bridging the body and the brain through neuroscience and systems physiology data, computational and spatial modeling, and device design.'
        },
      ]
    })
    return {
      consortiaItem,
      featuredDataset,
      highlights,
      contentfulError
    }
  },
  computed: {
    title() {
      return pathOr('', ['fields', 'title'], this.consortiaItem)
    },
    whoWeAre() {
      return pathOr('', ['fields', 'whoWeAre'], this.consortiaItem)
    },
    whoWeAreButtonText() {
      return pathOr('', ['fields', 'whoWeAreButtonText'], this.consortiaItem)
    },
    whoWeAreButtonLink() {
      return pathOr('', ['fields', 'whoWeAreButtonLink'], this.consortiaItem)
    },
    whatWeDo() {
      return pathOr('', ['fields', 'whatWeDo'], this.consortiaItem)
    },
    whatWeDoButtonText() {
      return pathOr('', ['fields', 'whatWeDoButtonText'], this.consortiaItem)
    },
    whatWeDoButtonLink() {
      return pathOr('', ['fields', 'whatWeDoButtonLink'], this.consortiaItem)
    },
    ourResearch() {
      return pathOr('', ['fields', 'ourResearch'], this.consortiaItem)
    },
    ourResearchButtonText() {
      return pathOr('', ['fields', 'ourResearchButtonText'], this.consortiaItem)
    },
    ourResearchButtonLink() {
      return pathOr('', ['fields', 'ourResearchButtonLink'], this.consortiaItem)
    },
    overview() {
      return pathOr('', ['fields', 'overview'], this.consortiaItem)
    },
    backgroundColor1() {
      return pathOr('f5f7fa', ['fields', 'firstColor'], this.consortiaItem)
    },
    backgroundColor2() {
      return pathOr('f5f7fa', ['fields', 'secondColor'], this.consortiaItem)
    },
    backgroundColor3() {
      return pathOr('', ['fields', 'thirdColor'], this.consortiaItem)
    },
    consortiaStyle() {
      return isEmpty(this.backgroundColor3) ?
        { backgroundImage: `linear-gradient(#${this.backgroundColor1}, #${this.backgroundColor2}` } :
        { backgroundImage: `linear-gradient(#${this.backgroundColor1}, #${this.backgroundColor2}, #${this.backgroundColor3}` }
    },
    logoUrl() {
      return pathOr('', ['fields', 'logo', 'fields', 'file', 'url'], this.consortiaItem)
    },
    featuredDatasetLink() {
      const datasetPath = this.featuredDataset?.id ? `/datasets/${this.featuredDataset.id}` : '/'
      return {
        isInternal: true,
        path: datasetPath
      }
    },
  }
}
</script>

<style scoped lang="scss">
@import 'sparc-design-system-components-2/src/assets/_variables.scss';
.featured-dataset-container {
  border: solid $lineColor1 1px;
  background-color: $background;
}

.row-item {
  width: 49%;
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

.gallery-items-container {
  background-color: white;
  border: 1px solid $lineColor1;
}
</style>
