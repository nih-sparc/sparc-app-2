<template>
  <div class="dataset-references">
    <div class="heading2 mb-8">
      Metrics
    </div>
    <div class="body1" v-loading="loadingMetrics">
      <div>
        Citations: <span class="label4">{{ citations }}</span>
      </div>
      <div>
        Downloads: <span class="label4">{{ fullDownloads }}</span>
      </div>
      <div v-if="protocols?.length > 0">
        Protocols:
        <sparc-tooltip placement="left-center">
          <template #item>
            <svgo-icon-help class="help-icon"/>
          </template>
          <template #data>
            Number of views and forks are only available for protocols hosted on <a href="https://protocols.io" target="_blank">Protocols.io</a>
          </template>
        </sparc-tooltip>
      </div>
      <div v-for="doi in protocols" :key="doi">
        <div class="ml-32">
          Protocol Link: <a :href="'https://doi.org/' + doi" target="_blank">https://doi.org/{{ doi }}</a>
        </div>
        <template v-if="isProtocolsIo(doi)">
          <div class="ml-32">
            Protocol Views: <span class="label4">{{ getProtocolViews(doi) }}</span>
          </div>
          <div class="ml-32">
            Number of Protocol Forks:
          </div>
          <div class="ml-64">
            Private: <span class="label4">{{ getProtocolPrivateForks(doi) }}</span>
          </div>
          <div class="ml-64">
            Public: <span class="label4">{{ getProtocolPublicForks(doi) }}</span>
          </div>
        </template>
      </div>
    </div>
    <template v-if="showScholarData && scholarData">
      <div class="heading2 mb-8 mt-16 scholar-data-heading">
        Scholar Data Metrics
        <sparc-tooltip placement="left-center">
          <template #item>
            <svgo-icon-help class="help-icon"/>
          </template>
          <template #data>
            These metrics are provided by <a href="https://scholardata.io" target="_blank" rel="noopener">Scholar Data</a>
            as part of the <a href="https://www.challenge.gov/challenge/s-index/" target="_blank" rel="noopener">NIH S-Index Challenge</a>.
            They are experimental and currently being evaluated for potential integration.
          </template>
        </sparc-tooltip>
      </div>
      <div class="scholar-data-cards">
        <div v-if="scholarData.totalCitations !== undefined" class="scholar-data-card">
          <div class="body2 scholar-data-card__label">Citations</div>
          <div class="heading1 scholar-data-card__value">{{ scholarData.totalCitations }}</div>
          <div class="caption scholar-data-card__desc">Total scholarly citations</div>
        </div>
        <div v-if="scholarData.totalMentions !== undefined" class="scholar-data-card">
          <div class="body2 scholar-data-card__label">Mentions</div>
          <div class="heading1 scholar-data-card__value">{{ scholarData.totalMentions }}</div>
          <div class="caption scholar-data-card__desc">Non-academic references</div>
        </div>
        <div v-if="scholarData.fujiScore" class="scholar-data-card">
          <div class="body2 scholar-data-card__label">FAIR Score</div>
          <div class="heading1 scholar-data-card__value">{{ scholarData.fujiScore.score }}</div>
          <div class="caption scholar-data-card__desc">FAIR assessment (v{{ scholarData.fujiScore.metricVersion }})</div>
        </div>
        <div v-if="scholarData.latestDIndex" class="scholar-data-card">
          <div class="body2 scholar-data-card__label">D-Index</div>
          <div class="heading1 scholar-data-card__value">{{ scholarData.latestDIndex.score }}</div>
          <div class="caption scholar-data-card__desc">Dataset impact index ({{ scholarData.latestDIndex.year }})</div>
        </div>
      </div>
      <div v-if="scholarData.datasetUrl" class="mt-8">
        <a :href="scholarData.datasetUrl" target="_blank" rel="noopener" class="body2">View more details on Scholar Data</a>
      </div>
    </template>
  </div>
</template>

<script setup>
import { pathOr } from 'ramda'

const PROTOCOLS_IO_PREFIX = '10.17504/'

const protocolsMap = ref({})
const scholarData = ref(null)
const loadingMetrics = ref(true)

const props = defineProps({
  protocols: Array,
  citations: Number,
  fullDownloads: Number,
  datasetDoi: String
})
const { protocols, datasetDoi } = toRefs(props)

const config = useRuntimeConfig()
const { $axios } = useNuxtApp()

const showScholarData = config.public.SHOW_SCHOLAR_DATA_METRICS == 'true'

const isProtocolsIo = (doi) => doi?.startsWith(PROTOCOLS_IO_PREFIX)

const toSuffix = (doi) => doi.slice(PROTOCOLS_IO_PREFIX.length)

async function fetchWithRetry(axios, url, retries = 3, delay = 500) {
  for (let attempt = 1; attempt <= retries; attempt++) {
    try {
      const { data } = await axios.get(url, {
        headers: { Authorization: `Bearer ${config.public.PROTOCOLS_IO_TOKEN}` }
      })
      return pathOr(null, ['payload', 'stats'], data)
    } catch (err) {
      if (attempt < retries) {
        await new Promise((res) => setTimeout(res, delay))
      } else {
        console.error(`Failed after ${retries} retries: ${url}`)
        return null
      }
    }
  }
}

async function fetchProtocolsWithLimit(dois, concurrency = 5) {
  const protocolsIoDois = (dois ?? []).filter(isProtocolsIo)
  if (protocolsIoDois.length === 0) return {}

  const results = {}
  const queue = [...protocolsIoDois]

  const workers = Array.from({ length: concurrency }, async () => {
    while (queue.length > 0) {
      const doi = queue.shift()
      const suffix = toSuffix(doi)
      const url = `${config.public.PROTOCOLS_IO_HOST}/api/v4/protocols/${suffix}`
      results[doi] = await fetchWithRetry($axios, url)
    }
  })

  await Promise.all(workers)
  return results
}

async function fetchScholarData(doi) {
  if (!showScholarData || !doi) return null
  try {
    const { data } = await $axios.get(
      `/api/scholardata?doi=${encodeURIComponent(doi)}`
    )
    return data
  } catch {
    return null
  }
}

[protocolsMap.value, scholarData.value] = await Promise.all([
  fetchProtocolsWithLimit(protocols?.value, 5),
  fetchScholarData(datasetDoi?.value)
])

loadingMetrics.value = false

const getProtocolViews = (doi) =>
  pathOr('N/A', [doi, 'number_of_views'], protocolsMap.value)

const getProtocolPrivateForks = (doi) =>
  pathOr('N/A', [doi, 'number_of_forks', 'private'], protocolsMap.value)

const getProtocolPublicForks = (doi) =>
  pathOr('N/A', [doi, 'number_of_forks', 'public'], protocolsMap.value)
</script>

<style lang="scss" scoped>
@import 'sparc-design-system-components-2/src/assets/_variables.scss';
.help-icon {
  color: $purple;
  height: 1.5rem;
  width: 1.5rem;
}
.scholar-data-heading {
  display: flex;
  align-items: center;
  gap: 0.5rem;
}
.scholar-data-cards {
  display: grid;
  grid-template-columns: repeat(4, 1fr);
  gap: 1rem;
  margin-top: 0.5rem;
}
.scholar-data-card {
  border: 1px solid $lineColor2;
  border-radius: 4px;
  padding: 1rem;
  text-align: center;
  &__label {
    background-color: #F5F7FA;
    color: $darkBlue;
    font-weight: 600;
    margin: -1rem -1rem 0.25rem -1rem;
    padding: 0.5rem 1rem;
    border-radius: 4px 4px 0 0;
  }
  &__value {
    color: $purple;
    margin-bottom: 0.25rem;
  }
  &__desc {
    color: $grey;
  }
}
</style>
