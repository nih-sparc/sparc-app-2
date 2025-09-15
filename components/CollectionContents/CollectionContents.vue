<template>
  <div>
    <div v-if="hasError">
      There was an unexpected error when attempting to fetch the collection content. Please try again later or click <a href="/contact-us?type=bug">here</a> to file a bug report.
    </div>
    <div class="dataset-container mb-16 pb-16" v-else v-for="doi in dois" :key="doi">
      <span class="img-col mr-16">
        <img class="banner-image" :src="doi.data?.banner" :alt="'image could not load'" />
      </span>
      <span>
        <nuxt-link
          class="dataset-name"
          :to="{
            name: 'datasets-datasetId',
            params: {
              datasetId: doi.data?.id
            }
          }"
        >
          {{ doi.data?.name }}
        </nuxt-link>
        <div class="dataset-description mt-8">
          {{ doi.data?.description }}
        </div>
      </span>
    </div>
  </div>
</template>
<script setup>
import { ref } from 'vue'
import { pathOr, propOr } from 'ramda'
import { useMainStore } from '../../../store'
import { storeToRefs } from 'pinia'
import { failMessage } from '@/utils/notification-messages'
const config = useRuntimeConfig()
const mainStore = useMainStore()
const { $axios } = useNuxtApp()
const route = useRoute()
const { datasetInfo } = storeToRefs(mainStore)
const hasError = ref(false)
const datasetId = propOr(route.params.datasetId, 'id', datasetInfo)
const datasetVersion = propOr(1, 'version', datasetInfo)

const contentsUrl = `${config.public.discover_api_host}/datasets/${datasetId}/versions/${datasetVersion}/dois?limit=999`
const dois = ref([])
try {
  fetch(contentsUrl).then((response) => {
    if (response.status != '200') {
      hasError.value = true
      failMessage("Unable to fetch collection content at this time.")
    }
    return response.json()
  }).then((data) => {
    dois.value = propOr([], 'dois', data)
  })
} catch (e) {
  hasError.value = true
  failMessage(`Unable to fetch collection content at this time: ${e}`)
}
</script>
<style scoped lang="scss">
@import 'sparc-design-system-components-2/src/assets/_variables.scss';
.dataset-container {
  border-bottom: 1px solid $lineColor1;
  display: flex;
}
.img-col {
  width: fit-content;
}
.banner-image {
  display: block;
  max-width: 160px;
  border: 1px solid $lineColor1;
}

.dataset-name {
  text-decoration: underline;
}

.dataset-description {
  word-wrap: break-word;
}

.dataset-container:last-of-type {
  padding-bottom: 0;
  margin-bottom: 0;
  border-bottom: none;
}
</style>