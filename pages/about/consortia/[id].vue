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
    <Breadcrumb :breadcrumb="breadcrumb" :title="title" />
    <div class="container pt-32">
      <paper class="row" :text="parseMarkdown(overview)" :logoSrc="logoUrl" show-share-links />
      <div class="row mt-32">
        <paper class="row-item" :text="parseMarkdown(whoWeAre)" :button-text="whoWeAreButtonText"
          :button-link="whoWeAreButtonLink" />
        <paper class="row-item" :text="parseMarkdown(ourResearch)" :button-text="ourResearchButtonText"
          :button-link="ourResearchButtonLink" />
        <paper v-if="forInvestigators" class="row-item" :text="parseMarkdown(forInvestigators)"
          :button-text="forInvestigatorsButtonLabel" :button-link-external="forInvestigatorsButtonLink" />
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

<script setup>
import { ref, computed, watch } from 'vue';
import { useAsyncData, useRoute, useNuxtApp, useRuntimeConfig } from '#app';

import Paper from '~/components/Paper/Paper.vue';
import Gallery from '~/components/Gallery/Gallery.vue';
import ProjectsAndDatasetsCard from '~/components/ProjectsAndDatasets/ProjectsAndDatasetsCard/ProjectsAndDatasetsCard.vue';
import LearnMoreCard from '@/components/LearnMoreCard/LearnMoreCard.vue';

import { pathOr } from 'ramda';
import { parseMarkdown } from '@/utils/formattingUtils.js'
import { useLocalStorage } from '~/composables/useLocalStorage';

const { storeInLocalStorage, getFromLocalStorage, storeTimeDelta, hasTimeDeltaPassed, resetTimestamp } = useLocalStorage();

const route = useRoute();
const { $contentfulClient, $pennsieveApiClient } = useNuxtApp();
const config = useRuntimeConfig();

const { data: consortiaItem, error: contentfulError } = await useAsyncData(async () => {
  const response = await $contentfulClient.getEntries({
    content_type: config.public.ctf_consortia_content_type_id,
    'fields.slug': route.params.id.toLowerCase(),
  });
  return pathOr([], ['items'], response)[0];
});

const highlights = ref([]);
const { items } = await $contentfulClient
  .getEntries({
    content_type: config.public.ctf_news_id,
    order: '-fields.publishedDate',
    limit: 999,
    'fields.consortiaHighlight[in]': consortiaItem.value?.fields?.slug,
  })
  highlights.value = items;

const breadcrumb = [
  { to: { name: 'index' }, label: 'Home' },
  { to: { name: 'about' }, label: 'About' },
];

const title = computed(() => pathOr('', ['fields', 'title'], consortiaItem.value));
const overview = computed(() => pathOr('', ['fields', 'overview'], consortiaItem.value));
const whoWeAre = computed(() => pathOr('', ['fields', 'whoWeAre'], consortiaItem.value));
const whoWeAreButtonText = computed(() => pathOr('', ['fields', 'whoWeAreButtonText'], consortiaItem.value))
const whoWeAreButtonLink = computed(() => pathOr('', ['fields', 'whoWeAreButtonLink'], consortiaItem.value))
const ourResearch = computed(() => pathOr('', ['fields', 'ourResearch'], consortiaItem.value))
const ourResearchButtonText = computed(() => pathOr('', ['fields', 'ourResearchButtonText'], consortiaItem.value))
const ourResearchButtonLink = computed(() => pathOr('', ['fields', 'ourResearchButtonLink'], consortiaItem.value))
const learnMore = computed(() => pathOr([], ['fields', 'learnMore'], consortiaItem.value))
const logoUrl = computed(() => pathOr('', ['fields', 'logo', 'fields', 'file', 'url'], consortiaItem.value))
const forInvestigators = computed(() => pathOr('', ['fields', 'forInvestigators'], consortiaItem.value))
const forInvestigatorsButtonLabel = computed(() => pathOr('', ['fields', 'forInvestigatorsButtonLabel'], consortiaItem.value))
const forInvestigatorsButtonLink = computed(() => pathOr('', ['fields', 'forInvestigatorsButtonLink'], consortiaItem.value))

const featuredDatasetLink = computed(() => {
  const datasetPath = featuredDataset.value?.id ? `/datasets/${featuredDataset.value.id}` : '/';
  return {
    isInternal: true,
    path: datasetPath,
  };
});

const featuredDatasetIdKey = computed(() => `${consortiaItem.value.fields.slug}_featuredDatasetId`);
const featuredDatasetIdsKey = computed(() => `${consortiaItem.value.fields.slug}_featuredDatasetIds`);
const listOfAvailableDatasetIdsKey = computed(() => `${consortiaItem.value.fields.slug}_listOfAvailableDatasetIds`);
const organizationFilterKey = computed(() => `${consortiaItem.value.fields.slug}_organizationFilter`);
const dateToShowFeaturedDatasetsUntilKey = computed(() => `${consortiaItem.value.fields.slug}_dateToShowFeaturedDatasetsUntil`);
const timeDeltaForFeaturedDatasetsKey = computed(() => `${consortiaItem.value.fields.slug}_timeDeltaForFeaturedDatasets`);

const featuredDatasetId = ref(null);
const featuredDataset = ref({});
watch(
  featuredDatasetId,
  async (id) => {
    if (id) {
      const pennsieveDatasetUrl = `${config.public.discover_api_host}/datasets/${id}`;
      try {
        const { data } = await $pennsieveApiClient.value.get(pennsieveDatasetUrl);
        featuredDataset.value = {
          title: data.name,
          description: data.description,
          banner: data.banner,
          id: data.id,
        };
      } catch {
        featuredDataset.value = {};
      }
    }
  },
  { immediate: true }
);

// Styling for consortia
const consortiaStyle = computed(() => {
  const bg1 = pathOr('f5f7fa', ['fields', 'firstColor'], consortiaItem.value);
  const bg2 = pathOr('f5f7fa', ['fields', 'secondColor'], consortiaItem.value);
  const bg3 = pathOr('', ['fields', 'thirdColor'], consortiaItem.value);
  const linkColor = pathOr('', ['fields', 'buttonAndLinkColor'], consortiaItem.value);
  return {
    backgroundImage: `linear-gradient(#${bg1}, #${bg2}${bg3 ? `, #${bg3}` : ''})`,
    '--button-and-link-color': `#${linkColor}`,
    '--button-and-link-secondary-color': `#${linkColor}16`,
  }
})

const resetListOfAvailableDatasetIds = async (featuredDatasetIds, dateToShowFeaturedDatasetsUntil, organizations) => {
  if (featuredDatasetIds?.length > 0) {
    const currentDate = new Date();
    // If the reset time has not passed or it is not set then just use the list of featured dataset ids set in Contentful
    if (!dateToShowFeaturedDatasetsUntil || isNaN(dateToShowFeaturedDatasetsUntil.getTime()) || currentDate < dateToShowFeaturedDatasetsUntil) {
      storeInLocalStorage(listOfAvailableDatasetIdsKey.value, featuredDatasetIds);
      return;
    }
  }

  const pennsieveDatasetUrl = `${config.public.discover_api_host}/search/datasets?limit=999&organization=${organizations}`;
  try {
    const { data } = await $pennsieveApiClient.value.get(pennsieveDatasetUrl);
    storeInLocalStorage(listOfAvailableDatasetIdsKey.value, data.datasets.map(dataset => dataset.id));
  } catch {
    storeInLocalStorage(listOfAvailableDatasetIdsKey.value, null);
  }
};

onMounted(async () => {
  const featuredDatasetIds = pathOr('', ['fields', 'featuredDatasets'], consortiaItem.value)
  const organizationFilter = pathOr('', ['fields', 'organizations'], consortiaItem.value)
  const dateToShowFeaturedDatasetsUntil = pathOr('', ['fields', 'dateToShowFeaturedDatasets'], consortiaItem.value)
  const timeDeltaForFeaturedDatasets = pathOr('', ['fields', 'timeDelta'], consortiaItem.value)

  const updatedFeaturedDatasetIds = storeInLocalStorage(featuredDatasetIdsKey.value, featuredDatasetIds)
  const updatedOrganizationFilter = storeInLocalStorage(organizationFilterKey.value, organizationFilter)
  const updatedDateToShowFeaturedDatasetsUntil = storeInLocalStorage(dateToShowFeaturedDatasetsUntilKey.value, dateToShowFeaturedDatasetsUntil)
  const updatedTimeDeltaForFeaturedDatasets = storeTimeDelta(timeDeltaForFeaturedDatasetsKey.value, timeDeltaForFeaturedDatasets)
  const hasAnyFeaturedDatasetsValuesChanged = updatedFeaturedDatasetIds || updatedOrganizationFilter || updatedDateToShowFeaturedDatasetsUntil || updatedTimeDeltaForFeaturedDatasets

  let listWasReset = false
  let availableFeaturedDatasetIds = getFromLocalStorage(listOfAvailableDatasetIdsKey.value)
  if (hasAnyFeaturedDatasetsValuesChanged || availableFeaturedDatasetIds == null || availableFeaturedDatasetIds.length < 1) {
    await resetListOfAvailableDatasetIds(featuredDatasetIds.value, new Date(dateToShowFeaturedDatasetsUntil), organizationFilter)
    listWasReset = true
  }
  if (hasTimeDeltaPassed(timeDeltaForFeaturedDatasetsKey.value) || listWasReset) {
    resetTimestamp(timeDeltaForFeaturedDatasetsKey.value)
    const availableDatasetIds = getFromLocalStorage(listOfAvailableDatasetIdsKey.value)
    if (availableDatasetIds == null || availableDatasetIds.length < 1)
    {
      storeInLocalStorage(featuredDatasetIdKey.value, null)
    } else {
      const randomIndex = Math.floor(Math.random() * availableDatasetIds.length)
      // Remove a random id from the list of available and set it as the featured id
      storeInLocalStorage(featuredDatasetIdKey.value, availableDatasetIds.splice(randomIndex, 1)[0])
      // Update local storage with the new list
      storeInLocalStorage(listOfAvailableDatasetIdsKey.value, availableDatasetIds)
    }
  }
  featuredDatasetId.value = getFromLocalStorage(featuredDatasetIdKey.value)
})
</script>

<style scoped lang="scss">
@import 'sparc-design-system-components-2/src/assets/_variables.scss';
.featured-dataset-container {
  border: solid $lineColor1 1px;
  background-color: white;
}

.row {
  display: flex;
  gap: 20px;
  @media screen and (max-width: 767px) {
    flex-direction: column;
  }
}

.row-item {
  flex: 1;
  display: flex;
  flex-direction: row;
  @media screen and (max-width: 767px) {
    width: 100%;
  }
  & > :deep(.subpage-col) {
    flex: 1
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
