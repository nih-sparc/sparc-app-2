<template>
  <div>
    <div v-if="hasError">
      There was an unexpected error when attempting to fetch the collection content. Please try again later or click <a href="/contact-us?type=bug">here</a> to file a bug report.
    </div>
    <div v-else v-for="doi in dois" :key="doi">
      {{ doi }}
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