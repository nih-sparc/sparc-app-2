<template>
  <div class="dataset-action-box mt-16 p-8">
    <div class="banner-container mb-4">
      <client-only>
        <div v-if="banners?.length > 0" class="img-grid">
          <div
            class="grid"
            :style="{
              gridTemplateColumns: `repeat(${getGridCols(collectionSize)}, 1fr)`,
              gridTemplateRows: `repeat(${getGridRows(collectionSize)}, 1fr)`
            }"
          >
            <img
              v-for="(img, index) in banners"
              :key="index"
              :src="img"
              :alt="`Banner ${index + 1}`"
            />
          </div>
        </div>
      </client-only>
    </div>
    <div class="pill-container" v-if="embargoed">
      <sparc-pill class="mb-4">
        Embargoed
      </sparc-pill>
    </div>
    <div class="button-container">
      <el-button
        v-if="hasContent"
        @click="actionButtonClicked('contents')"
      >
        View Contents
      </el-button>
    </div>
  </div>
</template>

<script setup>
import { storeToRefs } from 'pinia'
import { useMainStore } from '@/store/index.js'
import { pathOr, propOr } from 'ramda'
import DatasetBannerImage from '@/components/DatasetBannerImage/DatasetBannerImage.vue'
import SparcPill from '@/components/SparcPill/SparcPill.vue'

const store = useMainStore()
const { datasetInfo, datasetTypeName, userToken } = storeToRefs(store)

const router = useRouter()
const route = useRoute()
const config = useRuntimeConfig()

const version = computed(() => propOr(1, 'version', datasetInfo.value))
const banners = computed(() => datasetInfo.value?.doiCollection?.banners || [])
const collectionSize = computed(() => datasetInfo.value?.doiCollection?.size || 1)
const gridCols = computed(() => {
  const count = banners.value.length || 1
  return count === 1 ? 1 : Math.ceil(Math.sqrt(count))
})

const gridRows = computed(() => {
  const count = banners.value.length || 1
  return Math.ceil(count / gridCols.value)
})

const fileCount = computed(() => datasetInfo.value?.fileCount || 0)
const hasFiles = computed(() => fileCount.value >= 1)
const hasContent = computed(() => datasetInfo.value?.doiCollection?.size > 0)
const embargoed = computed(() => propOr(false, 'embargo', datasetInfo.value))
const sdsViewer = computed(() => {
  if (datasetInfo.value.doi) {
    const metacellUrl = new URL(config.public.METACELL_SDS_VIEWER_URL)
    metacellUrl.searchParams.append('doi', datasetInfo.value.doi)
    return metacellUrl.toString()
  }
  return null
})

function getGridCols(count) {
  if (count === 1) return 1
  if (count <= 4) return 2
  return 3
}

function getGridRows(count) {
  if (count === 1) return 1
  if (count <= 4) return 2
  return Math.ceil(count / 3)
}

function getDatasetDetailsTabArea() {
  return document.getElementById('datasetDetailsTabsContainer')
}

function scrollToDatasetDetailsTabArea() {
  getDatasetDetailsTabArea()?.scrollIntoView()
}

function actionButtonClicked(tabId) {
  router.replace({ query: { ...route.query, datasetDetailsTab: tabId } }).finally(() => {
    scrollToDatasetDetailsTabArea()
  })
}

function onSdsButtonClick() {
  if (!datasetInfo.value) return
  const payload = {
    event: 'interaction_event',
    event_name: 'sds_viewer_button_click',
    location: 'dataset_action_box',
    category: "",
    dataset_id: propOr('', 'id', datasetInfo.value),
    version_id: propOr('', 'version', datasetInfo.value),
    doi: propOr('', 'doi', datasetInfo.value),
    citation_type: "",
    files: "",
    file_name: "",
    file_path: "",
    file_type: "",
  }
  window.$gtm?.trackEvent(payload)
}
</script>

<style lang="scss" scoped>
@import 'sparc-design-system-components-2/src/assets/_variables.scss';

.dataset-action-box {
  display: flex;
  flex-direction: column;
  border: solid 1px $lineColor1;
  text-align: center;
  background: white;
  position: relative;
  button {
    margin: .25rem 0;
  }
  a {
    display: inline-grid;
    text-decoration: none;
  }
  .button-container {
    display: flex;
    flex-direction: column;
    width: fit-content;
    align-self: center;
  }
  .ospac-tooltip {
    color: $purple;
  }
}
.pill-container {
  position: absolute;
  right: 1rem;
  top: 1rem;
}

.img-grid {
  display: block;
  width: 100%;
  height: auto;

  .grid {
    display: grid;
    gap: 2px;
    width: 100%;
    height: 100%;
  }

  img {
    width: 100%;
    height: 100%;
    object-fit: cover;
    border-radius: 2px;
  }
}

.pill-container {
  margin-top: 8px;
}
</style>
