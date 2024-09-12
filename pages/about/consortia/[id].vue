<template>
  <Head>
    <Title>{{ title }}</Title>
    <Meta name="og:title" hid="og:title" :content="title" />
    <Meta name="twitter:title" :content="title" />
    <Meta name="description" hid="description" :content="overview" />
    <Meta name="og:description" hid="og:description" :content="overview" />
    <Meta name="twitter:description" :content="overview" />
  </Head>
  <div :style="consortiaStyle" class="pb-32">
    <breadcrumb :breadcrumb="breadcrumb" :title="title" />
    <div class="container pt-32">
      <paper class="row" :text="parseMarkdown(overview)" :logoSrc="logoUrl" show-share-links />
      <div class="row mt-32">
        <paper class="row-item" :text="parseMarkdown(whoWeAre)" :button-text="whoWeAreButtonText"
          :button-link="whoWeAreButtonLink" />
        <paper class="row-item" :text="parseMarkdown(ourResearch)" :button-text="ourResearchButtonText"
          :button-link="ourResearchButtonLink" />
      </div>
      <div v-if="featuredDataset?.title" class="featured-dataset-container p-24 mt-32">
        <div class="heading2 mb-16">Here is a dataset you might be interested in:</div>
        <projects-and-datasets-card :title="featuredDataset.title" :description="featuredDataset.description"
          :banner="featuredDataset.banner" :link="featuredDatasetLink" button-text="View Dataset" />
      </div>
      <div v-if="highlights.length > 0" class="gallery-items-container p-24 mt-32">
        <div class="heading2 mb-16">Highlights</div>
        <gallery galleryItemType="highlights" :cardWidth="68" :items="highlights" />
      </div>
      <div v-if="learnMore.length > 0" class="subpage">
        <div class="heading2 mb-16">Learn More</div>
        <template v-for="(item, index) in learnMore" :key="index">
          <div>
            <learn-more-card :about-details-item="item" />
            <hr v-if="learnMore.length > 1 && index != learnMore.length - 1" />
          </div>
        </template>
      </div>
    </div>
  </div>
</template>

<script>
import { ref } from 'vue'
import Paper from '~/components/Paper/Paper.vue'
import Gallery from '~/components/Gallery/Gallery.vue'
import ProjectsAndDatasetsCard from '~/components/ProjectsAndDatasets/ProjectsAndDatasetsCard/ProjectsAndDatasetsCard.vue'
import LearnMoreCard from '@/components/LearnMoreCard/LearnMoreCard.vue'
import { useLocalStorage } from '~/composables/useLocalStorage'

import marked from '@/mixins/marked'
import { pathOr, propOr, isEmpty } from 'ramda'

const { storeInLocalStorage, getFromLocalStorage, storeTimeDelta, hasTimeDeltaPassed, resetTimestamp } = useLocalStorage()

export default {
  name: 'ConsortiaPage',

  components: {
    Paper,
    Gallery,
    ProjectsAndDatasetsCard,
    LearnMoreCard
  },

  mixins: [marked],

  data: () => {
    return {
      featuredDatasetId: null,
      featuredDataset: {},
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
    const { $contentfulClient } = useNuxtApp()
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
    let highlights = ref([])
    $contentfulClient.getEntries({
      'content_type': config.public.ctf_news_id,
      order: '-fields.publishedDate',
      limit: '999',
      'fields.consortiaHighlight[in]': consortiaItem.fields.slug
    }).then(({ items }) => {
      highlights.value = items
    }).catch(() => {
      highlights.value = []
    })
    return {
      consortiaItem,
      highlights,
      contentfulError
    }
  },
  async mounted() {
    const featuredDatasetIds = pathOr('', ['fields', 'featuredDatasets'], this.consortiaItem)
    const organizationFilter = pathOr('', ['fields', 'organizations'], this.consortiaItem)
    const dateToShowFeaturedDatasetsUntil = pathOr('', ['fields', 'dateToShowFeaturedDatasets'], this.consortiaItem)
    const timeDeltaForFeaturedDatasets = pathOr('', ['fields', 'timeDelta'], this.consortiaItem)

    // Check if any of the values have been changed
    const updatedFeaturedDatasetIds = storeInLocalStorage(this.featuredDatasetIdsKey, featuredDatasetIds)
    const updatedOrganizationFilter = storeInLocalStorage(this.organizationFilterKey, organizationFilter)
    const updatedDateToShowFeaturedDatasetsUntil = storeInLocalStorage(this.dateToShowFeaturedDatasetsUntilKey, dateToShowFeaturedDatasetsUntil)
    const updatedTimeDeltaForFeaturedDatasets = storeTimeDelta(this.timeDeltaForFeaturedDatasetsKey, timeDeltaForFeaturedDatasets)
    const hasAnyFeaturedDatasetsValuesChanged = updatedFeaturedDatasetIds || updatedOrganizationFilter || updatedDateToShowFeaturedDatasetsUntil || updatedTimeDeltaForFeaturedDatasets

    let listWasReset = false
    let availableFeaturedDatasetIds = getFromLocalStorage(this.listOfAvailableDatasetIdsKey)
    if (hasAnyFeaturedDatasetsValuesChanged || availableFeaturedDatasetIds == null || availableFeaturedDatasetIds.length < 1) {
      await this.resetListOfAvailableDatasetIds(featuredDatasetIds, new Date(dateToShowFeaturedDatasetsUntil), organizationFilter)
      listWasReset = true
    }
    if (hasTimeDeltaPassed(this.timeDeltaForFeaturedDatasetsKey) || listWasReset) {
      resetTimestamp(this.timeDeltaForFeaturedDatasetsKey)
      const availableDatasetIds = getFromLocalStorage(this.listOfAvailableDatasetIdsKey)
      if (availableDatasetIds == null || availableDatasetIds.length < 1)
      {
        storeInLocalStorage(this.featuredDatasetIdKey, null)
      } else {
        const randomIndex = Math.floor(Math.random() * availableDatasetIds.length)
        // Remove a random id from the list of available and set it as the featured id
        storeInLocalStorage(this.featuredDatasetIdKey, availableDatasetIds.splice(randomIndex, 1)[0])
        // Update local storage with the new list
        storeInLocalStorage(this.listOfAvailableDatasetIdsKey, availableDatasetIds)
      }
    }
    this.featuredDatasetId = getFromLocalStorage(this.featuredDatasetIdKey)
  },
  watch: {
    'featuredDatasetId': {
      handler: async function (id) {
        if (!isEmpty(id) && id != null) {
          const pennsieveDatasetUrl = `${this.$config.public.discover_api_host}/datasets/${id}`
          try {
            const { data } = await this.$pennsieveApiClient.value.get(pennsieveDatasetUrl)
            this.featuredDataset = { 'title': data.name, 'description': data.description, 'banner': data.banner, 'id': data.id }
          } catch {
            this.featuredDataset = {}
          }
        }
      }
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
    learnMore() {
      return pathOr([], ['fields', 'learnMore'], this.consortiaItem)
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
    buttonAndLinkColor() {
      return pathOr('', ['fields', 'buttonAndLinkColor'], this.consortiaItem)
    },
    consortiaStyle() {
      let style = isEmpty(this.backgroundColor3) ?
        { backgroundImage: `linear-gradient(#${this.backgroundColor1}, #${this.backgroundColor2}` } :
        { backgroundImage: `linear-gradient(#${this.backgroundColor1}, #${this.backgroundColor2}, #${this.backgroundColor3}` }
      style = { ...style, '--button-and-link-color': `#${this.buttonAndLinkColor}`, '--button-and-link-secondary-color': `#${this.buttonAndLinkColor}16` }
      return style
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
    featuredDatasetIdKey() {
      return `${this.consortiaItem.fields.slug}_featuredDatasetId`
    },
    featuredDatasetIdsKey() {
      return `${this.consortiaItem.fields.slug}_featuredDatasetIds`
    },
    listOfAvailableDatasetIdsKey() {
      return `${this.consortiaItem.fields.slug}_listOfAvailableDatasetIds`
    },
    organizationFilterKey() {
      return `${this.consortiaItem.fields.slug}_organizationFilter`
    },
    dateToShowFeaturedDatasetsUntilKey() {
      return `${this.consortiaItem.fields.slug}_dateToShowFeaturedDatasetsUntil`
    },
    timeDeltaForFeaturedDatasetsKey() {
      return `${this.consortiaItem.fields.slug}_timeDeltaForFeaturedDatasets`
    }
  },
  methods: {
    async resetListOfAvailableDatasetIds(featuredDatasetIds, dateToShowFeaturedDatasetsUntil, organizations) {
      if (featuredDatasetIds?.length > 0) {
        const currentDate = new Date()
        // If the reset time has not passed or it is not set then just use the list of featured dataset ids set in Contentful
        if (isEmpty(dateToShowFeaturedDatasetsUntil) || isNaN(dateToShowFeaturedDatasetsUntil.getTime()) || currentDate < dateToShowFeaturedDatasetsUntil) {
          storeInLocalStorage(this.listOfAvailableDatasetIdsKey, featuredDatasetIds)
          return
        }
      }

      const pennsieveDatasetUrl = `${this.$config.public.discover_api_host}/search/datasets?limit=999&organization=${organizations}`
      try {
        const { data } = await this.$pennsieveApiClient.value.get(pennsieveDatasetUrl)
        storeInLocalStorage(this.listOfAvailableDatasetIdsKey, data.datasets.map(dataset => dataset.id))
      } catch {
        storeInLocalStorage(this.listOfAvailableDatasetIdsKey, null)
      }
    }
  }
}
</script>

<style scoped lang="scss">
@import 'sparc-design-system-components-2/src/assets/_variables.scss';
.featured-dataset-container {
  border: solid $lineColor1 1px;
  background-color: white;
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

:deep(.gallery-items-container),:deep(.featured-dataset-container) {
  button {
    background: var(--button-and-link-color) !important;
  }
  li.number {
    border-color: var(--button-and-link-color) !important;
  }
  li {
    color: var(--button-and-link-color) !important;
    background-color: var(--button-and-link-secondary-color) !important;
  }
  li.is-active {
    background-color: var(--button-and-link-color) !important;
    color: white !important;
  }
  li.number:hover {
    background-color: var(--button-and-link-color) !important;
  }
}
:deep(.el-button.secondary), :deep(.el-button)
{
  background-color: var(--button-and-link-secondary-color) !important;
  border-color: var(--button-and-link-color) !important;
  color: var(--button-and-link-color) !important;
}
:deep(.container) {
  a {
    color: var(--button-and-link-color) !important;
  }
}
:deep(.btn-copy-permalink) {
  path {
    fill: var(--button-and-link-color) !important;
  }
}

</style>
