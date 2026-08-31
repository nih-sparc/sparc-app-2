<template>
  <div class="page-data">
    <div class="home-hero">
      <div class="hero-inner">
        <div class="hero-eyebrow">Open data from molecule to system</div>
        <!-- eslint-disable vue/no-v-html -->
        <h1 class="hero-h1" v-if="heroHeading">{{ heroHeading }}</h1>
        <div class="hero-sub" v-html="parseMarkdown(heroCopy)" />
        <div class="hero-btns">
          <nuxt-link to="/data?type=dataset" class="hero-btn-primary">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" width="14" height="14">
              <ellipse cx="12" cy="6" rx="8" ry="3"/>
              <path d="M4 6v6c0 1.66 3.58 3 8 3s8-1.34 8-3V6"/>
              <path d="M4 12v6c0 1.66 3.58 3 8 3s8-1.34 8-3v-6"/>
            </svg>
            Access
          </nuxt-link>
          <nuxt-link to="/share-data" class="hero-btn-ghost">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" width="14" height="14">
              <path d="M12 3v12m0-12l-4 4m4-4l4 4"/>
              <path d="M4 17v2a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2v-2"/>
            </svg>
            Contribute
          </nuxt-link>
        </div>
      </div>
      <div class="hero-image-wrap">
        <img
          src="https://images.ctfassets.net/6bya4tyw8399/1vTvDLvi5CPAy9vqI7UjrB/7fa18b8c0fe2dc2f4a739b24e9dfb884/transparent-hero.png"
          alt="SPARC nervous system infographic"
          class="hero-image"
        />
      </div>
    </div>

    <!-- Interactive Map Section -->
    <div class="map-section">
      <div class="map-header">
        <div class="section-kicker">Interactive map</div>
        <h2 class="section-h2">Navigate the body's wiring diagram</h2>
        <p class="section-sub">Explore the body's neural pathways and anatomical connections, grounded in published science</p>
      </div>
      <div class="map-card">
        <div class="homepage-navigator-video">
          <video
            class="navigator-video"
            src="https://videos.ctfassets.net/6bya4tyw8399/3JK9DMGUPaGb9pbK6fPAzq/fba88d1f7ac369b72caf2218957787c0/sparc-hero-species-nocta-even.mp4"
            autoplay
            loop
            muted
            playsinline
          />

          <nuxt-link to="/apps/maps" class="map-open-hint">
            Open full map
            <svg viewBox="0 0 12 12" width="11" height="11" fill="none">
              <path d="M2 10L10 2M10 2H4M10 2v6" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"/>
            </svg>
          </nuxt-link>
        </div>
      </div>
    </div>

    <!-- Discover by topic section -->
    <div class="discover-section" ref="discoverSectionRef">
      <div class="discover-header">
        <div class="section-kicker">Explore the catalog</div>
        <h2 class="section-h2">Discover by topic</h2>
        <p class="section-sub">Browse datasets and models by experimental approach, anatomical structure, species, or contributing consortia</p>
      </div>
      <div class="facet-tabs">
        <button
          v-for="tab in facetTabConfig"
          :key="tab.id"
          class="facet-tab-pill"
          :class="{ active: activeFacetTab === tab.id }"
          @click="activeFacetTab = tab.id"
        >{{ tab.label }}</button>
      </div>
      <div class="facet-charts-container">
        <div
          v-for="tab in facetTabConfig"
          :key="tab.id"
          class="facet-chart"
          :class="{ 'facet-chart--hidden': activeFacetTab !== tab.id }"
        >
          <div
            v-for="(item, index) in visibleFacetDataByTab[tab.id].items"
            :key="item.label"
            class="facet-bar-row"
            :class="{ 'facet-bar-row--show-all': item.isShowAll }"
            role="button"
            tabindex="0"
            @click="navigateToFacet(item)"
            @keydown.enter="navigateToFacet(item)"
          >
            <div class="facet-bar-label">{{ item.label }}</div>
            <div class="facet-bar-track">
              <div
                class="facet-bar-fill"
                :class="{ 'facet-bar-fill--first': index === 0, 'facet-bar-fill--show-all': item.isShowAll }"
                :style="{
                  width: chartAnimated ? item.pct + '%' : '0%',
                  transition: chartAnimated ? `width 0.55s cubic-bezier(0.25, 0.46, 0.45, 0.94) ${index * 0.05}s` : 'none'
                }"
              >
                <span v-if="index === 0" class="facet-bar-count facet-bar-count--inside">{{ item.count.toLocaleString() }}</span>
              </div>
              <span v-if="index !== 0" class="facet-bar-count">{{ item.count.toLocaleString() }}</span>
            </div>
          </div>
          <button
            v-if="visibleFacetDataByTab[tab.id].hasMore"
            class="facet-show-more"
            @click="toggleShowMore(tab.id)"
          >{{ expandedTabs[tab.id] ? '− Compress' : '+ Expand' }}</button>
        </div>
      </div>
    </div>

    <!-- Explore the data section -->
    <div class="tools-section">
      <div class="tools-header">
        <div class="section-kicker">Platform Tools</div>
        <h2 class="section-h2">From Data to Discovery</h2>
        <p class="section-sub">Applications to visualize, simulate, and discover SPARC data, models, and knowledge</p>
      </div>
      <div class="tools-left">
        <div class="tools-nav">
          <button
            v-for="tab in toolTabs"
            :key="tab.id"
            class="tool-tab"
            :class="{ active: activeToolTab === tab.id }"
            @click="selectToolTab(tab.id)"
          >
            <span class="tool-tab-icon" v-html="tab.icon" aria-hidden="true"></span>
            <span class="tool-tab-label">{{ tab.label }}</span>
          </button>
        </div>
        <div class="tools-previews" @mouseenter="stopToolTabCycle" @mouseleave="startToolTabCycle">
          <div
            v-for="tab in toolTabs"
            :key="tab.id"
            class="tools-preview"
            :class="{ 'tools-preview--hidden': activeToolTab !== tab.id }"
          >
            <div class="preview-media">
              <a v-if="tab.external" :href="tab.href" target="_blank" rel="noopener">
                <video v-if="tab.video" :src="tab.video" autoplay loop muted playsinline />
                <img v-else :src="tab.image" :alt="tab.heading" />
              </a>
              <nuxt-link v-else :to="tab.href">
                <video v-if="tab.video" :src="tab.video" autoplay loop muted playsinline />
                <img v-else :src="tab.image" :alt="tab.heading" />
              </nuxt-link>
            </div>
            <div class="preview-text">
              <div class="section-kicker">{{ tab.kicker }}</div>
              <h3 class="preview-heading">{{ tab.heading }}</h3>
              <p class="preview-desc">{{ tab.desc }}</p>
              <a v-if="tab.external" :href="tab.href" target="_blank" rel="noopener" class="preview-btn">
                {{ tab.btnLabel }}
                <svg viewBox="0 0 12 12" width="11" height="11" fill="none" style="margin-left:6px;flex-shrink:0"><path d="M2 10L10 2M10 2H4M10 2v6" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"/></svg>
              </a>
              <nuxt-link v-else :to="tab.href" class="preview-btn">
                {{ tab.btnLabel }}
                <svg viewBox="0 0 12 12" width="11" height="11" fill="none" style="margin-left:6px;flex-shrink:0"><path d="M2 10L10 2M10 2H4M10 2v6" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"/></svg>
              </nuxt-link>
            </div>
          </div>
        </div>
      </div>
    </div>

    <!-- Find your path section -->
    <div class="path-section">
    <div class="path-header">
      <div class="section-kicker">A living resource, not an archive</div>
      <h2 class="section-h2">Join the exchange</h2>
      <p class="section-sub"> SPARC is where you find data to build on, contribute your own, and connect with the people advancing PNS and systems physiology research</p>
    </div>
    <div class="path-cards">

      <div class="path-card">
        <div class="path-card-kicker-group">
          <div class="path-card-kicker">Researchers</div>
          <div class="path-card-icon">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" width="28" height="28">
              <circle cx="12" cy="8" r="3.5"/>
              <path d="M5 20c0-3.314 3.134-6 7-6s7 2.686 7 6"/>
            </svg>
          </div>
        </div>
        <h3 class="path-card-heading">Use data</h3>
        <p class="path-card-desc">Programmatic access to datasets, models, metadata, and connectivity knowledge via APIs.</p>
        <a href="https://docs.sparc.science/docs/sparc-apis-and-open-access-code" target="_blank" rel="noopener" class="path-card-btn">Explore Docs <svg viewBox="0 0 12 12" width="11" height="11" fill="none" style="margin-left:6px;flex-shrink:0"><path d="M2 10L10 2M10 2H4M10 2v6" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"/></svg></a>
      </div>

      <div class="path-card">
        <div class="path-card-kicker-group">
          <div class="path-card-kicker">Contributors</div>
          <div class="path-card-icon">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" width="28" height="28">
              <path d="M3 16.5v2.25A2.25 2.25 0 0 0 5.25 21h13.5A2.25 2.25 0 0 0 21 18.75V16.5m-13.5-9L12 3m0 0 4.5 4.5M12 3v13.5"/>
            </svg>
          </div>
        </div>
        <h3 class="path-card-heading">Share your data</h3>
        <p class="path-card-desc">Submit datasets, protocols, and tools to the SPARC repository. Reach a global community of researchers bridging the body and brain and maximize the impact of your science.</p>
        <nuxt-link to="/share-data" class="path-card-btn">Submit to SPARC <svg viewBox="0 0 12 12" width="11" height="11" fill="none" style="margin-left:6px;flex-shrink:0"><path d="M2 10L10 2M10 2H4M10 2v6" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"/></svg></nuxt-link>
      </div>

      <div class="path-card">
        <div class="path-card-kicker-group">
          <div class="path-card-kicker">Community</div>
          <div class="path-card-icon">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" width="28" height="28">
              <path d="M12 7.5h1.5m-1.5 3h1.5m-7.5 3h7.5m-7.5 3h7.5m3-9h3.375c.621 0 1.125.504 1.125 1.125V18a2.25 2.25 0 0 1-2.25 2.25M16.5 7.5V18a2.25 2.25 0 0 0 2.25 2.25M16.5 7.5V4.875c0-.621-.504-1.125-1.125-1.125H4.125C3.504 3.75 3 4.254 3 4.875V18a2.25 2.25 0 0 0 2.25 2.25h13.5M6 7.5h3v3H6V7.5Z"/>
            </svg>
          </div>
        </div>
        <h3 class="path-card-heading">News</h3>
        <p class="path-card-desc">Stay up-to-date with the latest from the community, including new datasets, tool launches, consortium updates, and events.</p>
        <nuxt-link to="/news-and-events" class="path-card-btn">All News <svg viewBox="0 0 12 12" width="11" height="11" fill="none" style="margin-left:6px;flex-shrink:0"><path d="M2 10L10 2M10 2H4M10 2v6" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"/></svg></nuxt-link>
      </div>

    </div>
  </div>

  </div>

</template>

<script setup>
import { failMessage } from '@/utils/notification-messages'
import { parseMarkdown } from '@/utils/formattingUtils.js'
import getHomepageFields from '@/utils/homepageFields'
import { useMainStore } from '../store/index.js'
import { pathOr } from 'ramda'
import { useRuntimeConfig, useAsyncData } from '#app'

const config = useRuntimeConfig()
const { $contentfulClient, $axios, $algoliaClient } = useNuxtApp()
useHead({
  title: 'SPARC Portal',
  bodyAttrs: { style: 'background: #F5F7FA' },
  meta: [
    {
      name: 'description',
      content:
        'The open community platform for bridging the body and the brain through neuroscience and systems physiology data, computational and spatial modeling, and device design.'
    },
    { name: 'og:type', content: 'website' },
    { property: 'og:title', content: 'SPARC Portal' },
    { name: "google-site-verification", content: `${config.public.GOOGLE_SEARCH_CONSOLE_VERIFICATION_ID}` },
    { property: 'og:image', content: 'https://images.ctfassets.net/6bya4tyw8399/7r5WTb92QnHkub8RsExuc1/2ac134de2ddfd65eb6316421df7578f9/sparc-logo-primary.png' },
    { property: 'og:image:secure_url', content: 'https://images.ctfassets.net/6bya4tyw8399/7r5WTb92QnHkub8RsExuc1/2ac134de2ddfd65eb6316421df7578f9/sparc-logo-primary.png' },
    { name: 'og:site_name', content: 'SPARC Portal' },
    { name: 'twitter:card', content: 'summary' },
    { name: 'twitter:site', content: '@sparc_science' },
    { name: 'twitter:title', content: 'SPARC Portal' },
    { name: 'twitter:image', content: 'https://images.ctfassets.net/6bya4tyw8399/7r5WTb92QnHkub8RsExuc1/2ac134de2ddfd65eb6316421df7578f9/sparc-logo-primary.png' },
    { name: 'twitter:description', content: 'The open community platform for bridging the body and the brain through neuroscience and systems physiology data, computational and spatial modeling, and device design.' }
  ]
})
    
const _consortiaCache = useState('_consortiaCache', () => null)
const { data: consortiaItems, error: consortiaError } = useAsyncData('consortiaItems', async () => {
  try {
    const items = await $fetch('/api/contentful/homepage-consortia')
    _consortiaCache.value = items
    return items
  } catch (err) {
    console.error('Could not fetch consortia data from Contentful.', err)
    return []
  }
}, { getCachedData: () => _consortiaCache.value || undefined })

const _homepageCache = useState('_homepageCache', () => null)
const { data: homepageData, error: homepageError } = useAsyncData('homepage', async () => {
  const result = await $fetch('/api/contentful/homepage')
  _homepageCache.value = result
  return result
}, { getCachedData: () => _homepageCache.value || undefined })

const _featuredDataCategoriesCache = useState('_featuredDataCategoriesCache', () => null)
const { data: featuredDataCategories, error: featuredDataCategoriesError } = useAsyncData('featuredDataCategories', async () => {
  const categories = await $fetch('/api/contentful/featured-data-categories').catch(() => [])
  _featuredDataCategoriesCache.value = categories
  return categories
}, { getCachedData: () => _featuredDataCategoriesCache.value || undefined })

const _featuredDatasetsCache = useState('_featuredDatasetsCache', () => null)
const { data: featuredDatasets, error: featuredDatasetsError } = useAsyncData('featuredDatasets', async () => {
  try {
    const response = await $axios.get(`${config.public.portal_api}/get_featured_dataset`)
    _featuredDatasetsCache.value = response.data?.datasets
    return response.data?.datasets
  } catch {
    const response = await $axios.get(`${config.public.discover_api_host}/datasets/32`)
    _featuredDatasetsCache.value = [response.data]
    return [response.data]
  }
}, { getCachedData: () => _featuredDatasetsCache.value || undefined });

const institutionId = computed(() =>
  pathOr(undefined, ['featuredProject', 'fields', 'institutions', 0, 'sys', 'id'], homepageData?.value?.fields)
);

const { data: institutionData, error: institutionError } = useAsyncData(
  'institution',
  async () => {
    if (!institutionId.value) return false;
    return $fetch(`/api/contentful/entry/${institutionId.value}`).catch(() => false);
  },
  { watch: [institutionId] }
);

const fields = computed(() => {
  if (!homepageData.value) return null;
  let fields = getHomepageFields(homepageData.value?.fields);
  const datasetSectionTitle = homepageData.value?.fields.datasetSectionTitle;
  if (featuredDatasets.value?.length > 0) {
    const featuredDataset = {
      title: featuredDatasets.value[0].name,
      description: featuredDatasets.value[0].description,
      banner: featuredDatasets.value[0].banner,
      id: featuredDatasets.value[0].id,
    }
    fields = { ...fields, featuredDataset, datasetSectionTitle }
  }
  if (institutionData.value) {
    fields.featuredProject.fields.banner = institutionData.value?.fields.logo.fields.file.url;
  }
  return fields;
})

const heroHeading = computed(() => fields.value?.heroHeading)
const heroImage = computed(() => fields.value?.heroImage)
const heroCopy = computed(() => fields.value?.heroCopy)

const router = useRouter()

const { data: algoliaFacetData } = useAsyncData('facets', async () => {
  const algoliaIndex = $algoliaClient.initIndex(config.public.ALGOLIA_INDEX_VERSION_PUBLISHED_TIME_DESC)
  const result = await algoliaIndex.search('', {
    hitsPerPage: 0,
    facets: ['item.modalities.keyword', 'anatomy.organ.category.name', 'organisms.primary.species.name', 'supportingAwards.consortium.name'],
  })
  return { facets: result.facets || {}, nbHits: result.nbHits || 0 }
})

const facetTabConfig = [
  { id: 'modality',   label: 'By approach',   path: 'item.modalities.keyword' },
  { id: 'anatomy',      label: 'By anatomy',      path: 'anatomy.organ.category.name' },
  { id: 'species',    label: 'By species',    path: 'organisms.primary.species.name' },
  { id: 'consortium', label: 'By consortium', path: 'supportingAwards.consortium.name' },
]

const activeFacetTab = ref('modality')
const chartAnimated = ref(false)
const discoverSectionRef = ref(null)
const labelColWidth = ref('max-content')

onMounted(() => {
  if (!discoverSectionRef.value) return
  const observer = new IntersectionObserver(
    ([entry]) => {
      if (entry.isIntersecting) {
        chartAnimated.value = true
        observer.disconnect()
      }
    },
    { threshold: 0.15 }
  )
  observer.observe(discoverSectionRef.value)
})

watch(activeFacetTab, async () => {
  chartAnimated.value = false
  expandedTabs.value = {}
  await nextTick()
  requestAnimationFrame(() => requestAnimationFrame(() => {
    chartAnimated.value = true
  }))
})

function buildFacetItems(raw, totalCount) {
  const items = Object.entries(raw || {})
    .map(([label, count]) => ({ label, count }))
    .sort((a, b) => b.count - a.count)
  const max = items[0]?.count || 1
  // Real items scaled to 95% max so "Total" at 100% is visually 5 points wider
  const realItems = items.map(item => ({ ...item, pct: Math.max(Math.round((item.count / max) * 95), 1) }))
  return [
    { label: 'Total', count: totalCount, pct: 100, isShowAll: true },
    ...realItems,
  ]
}

const facetDataByTab = computed(() => {
  const raw = algoliaFacetData.value || {}
  const data = raw.facets || {}
  const nbHits = raw.nbHits || 0
  return Object.fromEntries(
    facetTabConfig.map(tab => [tab.id, buildFacetItems(data[tab.path], nbHits)])
  )
})

const SHOW_MORE_COUNT = 12
const expandedTabs = ref({})

function toggleShowMore(tabId) {
  expandedTabs.value = { ...expandedTabs.value, [tabId]: !expandedTabs.value[tabId] }
}

const visibleFacetDataByTab = computed(() => {
  return Object.fromEntries(
    facetTabConfig.map(tab => {
      const [total, ...realItems] = facetDataByTab.value[tab.id] || []
      const hasMore = realItems.length > SHOW_MORE_COUNT
      const visibleRealItems = expandedTabs.value[tab.id] ? realItems : realItems.slice(0, SHOW_MORE_COUNT)
      return [tab.id, { items: total ? [total, ...visibleRealItems] : visibleRealItems, hasMore }]
    })
  )
})

const measureLabelColWidth = async () => {
  await nextTick()
  const labels = document.querySelectorAll('.facet-bar-label')
  let max = 0
  labels.forEach(el => { if (el.scrollWidth > max) max = el.scrollWidth })
  if (max > 0) labelColWidth.value = `${max}px`
}

watch(visibleFacetDataByTab, measureLabelColWidth)
onMounted(measureLabelColWidth)

function navigateToFacet(item) {
  if (item.isShowAll) {
    router.push({ path: '/data', query: { type: 'dataset' } })
  } else {
    router.push({ path: '/data', query: { type: 'dataset', selectedFacetIds: item.label } })
  }
}

const toolTabs = [
    {
    id: 'precision', label: 'Precision Atlas',
    icon: `<svg viewBox="0 0 16 16" fill="none" xmlns="http://www.w3.org/2000/svg"><path d="M1 11.5 Q3 9 5 10 T8 7 T11 5 T15 6" stroke="currentColor" stroke-width="1.2" stroke-linecap="round" fill="none"/><path d="M1 13 Q4 11.5 6 12 T10 10 T15 9.5" stroke="currentColor" stroke-width="1.2" stroke-linecap="round" fill="none" opacity="0.5"/></svg>`,
    video: 'https://videos.ctfassets.net/6bya4tyw8399/4hG99G3CdVfjzNUaK2Uiwt/c29b44c400dbe21121a73be751a39211/precision-explore-data-callouts.mp4',
    kicker: 'Gene expression',
    heading: 'Query gene expression across cell types',
    desc: 'Search any gene to see expression profiles across DRG neuron subtypes — UMAP projections and violin plots sourced directly from SPARC datasets.',
    href: '/apps/precision-dashboard',
    external: false,
    btnLabel: 'Open Precision Atlas',
  },
  {
    id: 'nervosensus', label: 'NervoSensus',
    icon: `<svg viewBox="0 0 16 16" fill="none" xmlns="http://www.w3.org/2000/svg"><circle cx="4" cy="11" r="1.5" stroke="currentColor" stroke-width="1.2"/><circle cx="8" cy="5" r="1.5" stroke="currentColor" stroke-width="1.2"/><circle cx="12" cy="9" r="1.5" stroke="currentColor" stroke-width="1.2"/><circle cx="6" cy="8" r="1" stroke="currentColor" stroke-width="1.2"/><circle cx="10" cy="12" r="1" stroke="currentColor" stroke-width="1.2"/><circle cx="3" cy="5" r="1" stroke="currentColor" stroke-width="1.2"/></svg>`,
    video: 'https://videos.ctfassets.net/6bya4tyw8399/4g2MwniDKFfBU6xLfs9mw0/f48d73e5582c6ba848e31f920e7792da/nervosensus-explore-data-callouts_1.mp4',
    kicker: 'Cell explorer',
    heading: 'Navigate cell types interactively',
    desc: 'Click any neuron bubble to surface its proposed relationships, marker genes, gene expression distribution, and axon phenotype.',
    href: 'https://devservosensus.netlify.app/',
    external: false,
    btnLabel: 'Open NervoSensus',
  },
  {
    id: 'osparc', label: 'o²S²PARC',
    icon: `<svg viewBox="0 0 16 16" fill="none" xmlns="http://www.w3.org/2000/svg"><rect x="2" y="4" width="3" height="3" rx="0.5" stroke="currentColor" stroke-width="1.2"/><rect x="6.5" y="2" width="3" height="3" rx="0.5" stroke="currentColor" stroke-width="1.2"/><rect x="11" y="4" width="3" height="3" rx="0.5" stroke="currentColor" stroke-width="1.2"/><rect x="6.5" y="9" width="3" height="3" rx="0.5" stroke="currentColor" stroke-width="1.2"/><path d="M5 5.5H6.5M9.5 3.5H11M9.5 5.5H11M8 5V9" stroke="currentColor" stroke-width="1.2" stroke-linecap="round"/></svg>`,
    video: 'https://videos.ctfassets.net/6bya4tyw8399/7s6GTmypEzkDhytZYniK9S/1e05fdc8c8b83e25e74165e7f0b7fb7b/osparc__978_x_504_px_.mp4',
    kicker: 'Computational platform',
    heading: 'Build and run computational workflows',
    desc: 'Connect services and models into reproducible pipelines. o²S²PARC lets you run simulations, share notebooks, and collaborate on computational studies — no local setup required.',
    href: '/tools-and-resources/4LkLiH5s4FV0LVJd3htsvH',
    external: true,
    btnLabel: 'Open o²S²PARC',
  },
  {
    id: 'sckan-nli', label: 'SCKAN NLI',
    icon: `<svg viewBox="0 0 16 16" fill="none" xmlns="http://www.w3.org/2000/svg"><path d="M2 4h12M2 8h8M2 12h5" stroke="currentColor" stroke-width="1.2" stroke-linecap="round"/><circle cx="13" cy="11" r="2" stroke="currentColor" stroke-width="1.2"/><path d="M14.5 12.5l1.5 1.5" stroke="currentColor" stroke-width="1.2" stroke-linecap="round"/></svg>`,
    video: 'https://videos.ctfassets.net/6bya4tyw8399/4Q60crr4xcaqfDdhcr9hcb/56ad456f5c0af7f3c9b9259cadeaac81/SCKAN_NLIv2__978_x_504_px_.mp4',
    kicker: 'Natural language interface',
    heading: 'Query SCKAN in plain English',
    desc: 'Ask questions about neural connectivity in natural language. SCKAN NLI translates your query into structured SPARQL and returns grounded answers from the SCKAN knowledge base.',
    href: '/tools-and-resources/Fvi4qS2bwKTXPIdoYzelB',
    external: false,
    btnLabel: 'Open SCKAN NLI',
  },
  {
    id: 'sckanner', label: 'SCKANNER',
    icon: `<svg viewBox="0 0 16 16" fill="none" xmlns="http://www.w3.org/2000/svg"><circle cx="8" cy="8" r="5.5" stroke="currentColor" stroke-width="1.2"/><circle cx="8" cy="8" r="2.5" stroke="currentColor" stroke-width="1.2"/><path d="M8 1v2M8 13v2M1 8h2M13 8h2" stroke="currentColor" stroke-width="1.2" stroke-linecap="round"/></svg>`,
    video: 'https://videos.ctfassets.net/6bya4tyw8399/4DT325nAYvgQ5m36fQ3YE8/5d3d6bcef61e9b15a2521fcc8a6e2685/sckanner-explore-data-callouts_1.mp4',
    kicker: 'Knowledge browser',
    heading: 'Explore SCKAN connectivity knowledge',
    desc: 'Browse the full SCKAN connectivity graph — filter by species, organ, and pathway type to surface the anatomical evidence behind every nerve connection.',
    href: '/tools-and-resources/3Ad4kbyYnXsUtzRFzUguwg',
    external: false,
    btnLabel: 'Open SCKANNER',
  },
]
const activeToolTab = ref('precision')

let toolTabCycleTimer = null
const stopToolTabCycle = () => {
  clearInterval(toolTabCycleTimer)
  toolTabCycleTimer = null
}
const startToolTabCycle = () => {
  clearInterval(toolTabCycleTimer)
  toolTabCycleTimer = setInterval(() => {
    const index = toolTabs.findIndex(tab => tab.id === activeToolTab.value)
    activeToolTab.value = toolTabs[(index + 1) % toolTabs.length].id
  }, 10000)
}
const selectToolTab = (id) => {
  activeToolTab.value = id
  startToolTabCycle()
}
onMounted(startToolTabCycle)
onBeforeUnmount(() => clearInterval(toolTabCycleTimer))


if (homepageError.value) {
  console.error(homepageError.value)
  failMessage("Some services are temporarily unavailable, which may cause certain pages to load incompletely.")
}

const { profileComplete, userProfile } = storeToRefs(useMainStore)

watch(
  () => profileComplete?.value, (newVal) => {
    if (userProfile?.value && !newVal) {
      navigateTo('/welcome');
    }
  },
  { immediate: true }
)

onBeforeMount(() => {
  const signInRedirectCookie = useCookie('sign-in-redirect-url');
  if (signInRedirectCookie.value) {
    const signInRedirectUrl = signInRedirectCookie.value;
    signInRedirectCookie.value = null;
    return navigateTo(signInRedirectUrl)
  }
});
</script>

<style lang="scss" scoped>
@import 'sparc-design-system-components-2/src/assets/_variables.scss';

.page-data {
  background-color: $background;
}

/* ── Hero ── */
.home-hero {
  background: $background;
  padding: 4rem max(2rem, calc((100% - 1280px) / 2));
  display: flex;
  align-items: center;
  justify-content: space-between;
  @media (max-width: 768px) { flex-direction: column; }
}

.hero-inner {
  position: relative;
  flex: 1;
  min-width: 0;
  max-width: 770px;
}

.hero-image-wrap {
  opacity: .85;
  flex-shrink: 0;
  mask-image:
    linear-gradient(to bottom, transparent 0%, black 18%, black 82%, transparent 100%),
    linear-gradient(to right,  transparent 0%, black 18%, black 100%);
  mask-composite: intersect;
  -webkit-mask-image:
    linear-gradient(to bottom, transparent 0%, black 18%, black 82%, transparent 100%),
    linear-gradient(to right,  transparent 0%, black 18%, black 100%);
  -webkit-mask-composite: source-in;
  @media (max-width: 1024px) { width: 320px; }
  @media (max-width: 768px) {
    width: 100%;
    mask-image: linear-gradient(to bottom, transparent 0%, black 12%, black 88%, transparent 100%);
    -webkit-mask-image: linear-gradient(to bottom, transparent 0%, black 12%, black 88%, transparent 100%);
  }
}

.hero-image {
  width: auto;
  max-height: 367px;
  display: block;
}

.hero-eyebrow {
  font-size: 1rem;
  letter-spacing: 0.1em;
  text-transform: uppercase;
  color: $purple;
  margin-bottom: 0.9rem;
  font-weight: 500;
}

.hero-h1 {
  font-size: 42px;
  font-weight: 500;
  line-height: 1.1;
  color: $darkBlue;
  margin-bottom: 0.9rem;
  @media (max-width: 768px) { font-size: 30px; }
}

.hero-sub {
  font-size: 1rem;
  color: $neutralGrey;
  line-height: 1.75;
  margin-bottom: 1.75rem;
  :deep(p) { margin: 0; }
}

.hero-btns {
  display: flex;
  gap: 10px;
  flex-wrap: wrap;
}

.hero-btn-primary {
  display: inline-flex;
  align-items: center;
  gap: 6px;
  background: $purple;
  color: #fff;
  font-size: 1rem;
  border-radius: 4px;
  padding: 9px 18px;
  text-decoration: none;
  font-weight: 500;
  transition: background 0.15s;
  &:hover { background: #9a00de; color: #fff; }
}

.hero-btn-ghost {
  display: inline-flex;
  align-items: center;
  gap: 6px;
  background: transparent;
  color: $mediumGrey;
  font-size: 1rem;
  border-radius: 4px;
  padding: 9px 18px;
  border: 1px solid $lineColor1;
  text-decoration: none;
  transition: background 0.15s, color 0.15s, border-color 0.15s;
  &:hover { background: $background; color: $grey; border-color: $purple; }
}

/* ── Shared section text ── */
.section-kicker {
  font-size: 1rem;
  letter-spacing: 0.1em;
  text-transform: uppercase;
  color: $purple;
  font-weight: 500;
  margin-bottom: 0.9rem;
}

.section-h2 {
  font-size: 42px;
  font-weight: 500;
  line-height: 1.1;
  color: $darkBlue;
  margin-bottom: 0.9rem;
  @media (max-width: 768px) { font-size: 30px; }
}

.section-sub {
  font-size: 1rem;
  color: $neutralGrey;
  line-height: 1.75;
  margin-bottom: 0;
}

/* ── Map section ── */
.map-section {
  background: $background;
  padding: 2rem max(2rem, calc((100% - 1280px) / 2));
}

.map-header {
  text-align: right;
  margin-bottom: 1.5rem;
  max-width: 770px;
  margin-left: auto;
  @media (max-width: 768px) { text-align: left; }
}

.map-card {
  border-radius: 4px;
  overflow: hidden;
  background: #fff;
}

.homepage-navigator-video {
  position: relative;
  width: 100%;
  aspect-ratio: 16 / 7;
  overflow: hidden;
}

.navigator-video {
  width: 100%;
  height: 100%;
  object-fit: cover;
  display: block;
}

.map-open-hint {
  position: absolute;
  top: 56%;
  left: 85%;
  transform: translateX(-100%);
  width: max-content;
  white-space: nowrap;
  z-index: 11;
  display: inline-flex;
  align-items: center;
  gap: 6px;
  font-size: 0.9rem;
  font-weight: 500;
  background: #8300bf;
  color: #fff;
  border: none;
  border-radius: 8px;
  padding: 8px 14px;
  cursor: pointer;
  font-family: inherit;
  text-decoration: none;
  transition: background 0.12s;

  @media (max-width: 680px) {
    font-size: 0.7rem;
    gap: 4px;
    padding: 5px 9px;
    border-radius: 6px;

    svg {
      width: 8px;
      height: 8px;
    }
  }

  &:hover {
    background: #6a009a;
  }
}

/* ── Discover by topic ── */
.discover-section {
  background: $background;
  padding: 2rem max(2rem, calc((100% - 1280px) / 2));
}

.discover-header {
  margin-bottom: 1.25rem;
  max-width: 770px;
}

.facet-tabs {
  display: flex;
  flex-direction: row;
  flex-wrap: wrap;
  gap: 8px;
  margin-bottom: 1.25rem;
}

.facet-tab-pill {
  display: inline-block;
  width: fit-content;
  font-size: 1rem;
  font-weight: 500;
  padding: 5px 16px;
  border-radius: 4px;
  border: 1px solid $lineColor1;
  background: transparent;
  color: $mediumGrey;
  cursor: pointer;
  font-family: inherit;
  transition: all 0.15s;
  text-align: left;
  &:hover { color: $grey; border-color: $purple; }
  &.active {
    background: rgba(131, 0, 191, 0.06);
    color: $purple;
    border-color: rgba(131, 0, 191, 0.35);
  }
}

.facet-charts-container {
  display: grid;
  grid-template-columns: 1fr;
}

.facet-chart {
  grid-column: 1;
  grid-row: 1;
  display: grid;
  grid-template-columns: v-bind(labelColWidth) 1fr;
  row-gap: 3px;
  column-gap: 12px;
}

.facet-chart--hidden {
  visibility: hidden;
  pointer-events: none;
}

.facet-bar-row {
  grid-column: 1 / -1;
  display: grid;
  grid-template-columns: subgrid;
  align-items: start;
  cursor: pointer;
  border-radius: 4px;
  padding: 2px 4px;
  transition: background 0.12s;
  &:focus-visible { outline: 1px solid rgba(131, 0, 191, 0.7); }
}

.facet-bar-label {
  font-size: 1rem;
  color: $grey;
  white-space: nowrap;
  text-transform: capitalize;
}

.facet-bar-track {
  flex: 1;
  height: 30px;
  background: $lineColor2;
  border-radius: 4px;
  overflow: visible;
  display: flex;
  align-items: center;
  gap: 10px;
}

.facet-bar-fill {
  align-self: stretch;
  background: linear-gradient(90deg, #5500aa, #8300bf);
  border-radius: 4px;
  flex-shrink: 0;
}

.facet-bar-fill--first {
  display: flex;
  align-items: center;
  justify-content: flex-end;
}

.facet-bar-row--show-all {
  .facet-bar-label { font-weight: 600; color: $purple; }
}

.facet-bar-fill--show-all {
  background: linear-gradient(90deg, #3d007a, #6600a0);
}

.facet-bar-count {
  font-size: 1rem;
  font-weight: 500;
  color: $purple;
  white-space: nowrap;
  flex-shrink: 0;
}

.facet-bar-count--inside {
  color: #fff;
  padding-right: 10px;
}

.facet-show-more {
  grid-column: 2;
  justify-self: center;
  margin-top: 8px;
  font-size: 0.9rem;
  font-weight: 500;
  color: $purple;
  background: none;
  border: none;
  cursor: pointer;
  padding: 4px 0;
  font-family: inherit;
}

/* ── Explore the data ── */
.tools-section {
  background: $background;
  padding: 2rem max(2rem, calc((100% - 1280px) / 2));
}

.tools-header {
  text-align: right;
  margin-bottom: 1.5rem;
  max-width: 770px;
  margin-left: auto;
  @media (max-width: 768px) { text-align: left; }
}

.tools-left {
  width: 100%;
  height: 560px;
  display: flex;
  flex-direction: column;
}

.tools-nav {
  display: flex;
  gap: 0;
  flex-wrap: wrap;
  margin-bottom: 1.25rem;
  border-bottom: 1px solid $lineColor1;
}

.tool-tab {
  display: inline-flex;
  align-items: center;
  gap: 7px;
  padding: 8px 18px 10px;
  background: transparent;
  border: none;
  border-bottom: 2px solid transparent;
  color: $lightGrey;
  font-size: 1rem;
  font-family: inherit;
  font-weight: 400;
  cursor: pointer;
  transition: color 0.15s, border-color 0.15s;
  margin-bottom: -1px;
  &:hover { color: $grey; }
  &.active {
    color: $grey;
    border-bottom-color: $purple;
    font-weight: 500;
  }
}

.tool-tab-icon {
  display: flex;
  align-items: center;
  width: 16px;
  height: 16px;
  flex-shrink: 0;
  svg { width: 16px; height: 16px; }
}

.tool-tab-label { line-height: 1; }

.tools-previews {
  display: grid;
  grid-template-columns: 1fr;
  flex: 1;
  min-height: 0;
}

.tools-preview {
  grid-column: 1;
  grid-row: 1;
  display: flex;
  align-items: stretch;
  border: 1px solid $lineColor1;
  border-radius: 4px;
  overflow: hidden;
  background: #fff;
  @media (max-width: 768px) { flex-direction: column; height: auto; }
}

.tools-preview--hidden {
  height: stretch;
  visibility: hidden;
  pointer-events: none;
}

.preview-media {
  flex: 1;
  min-height: 0;
  background: white;
  overflow: hidden;
  position: relative;
  a, :deep(a) {
    position: absolute;
    inset: 0;
    display: block;
  }
  img, video {
    width: 100%;
    height: 100%;
    object-fit: contain;
    display: block;
  }
}

.preview-text {
  width: 260px;
  flex-shrink: 0;
  order: -1;
  padding: 2rem 1.25rem;
  display: flex;
  flex-direction: column;
  justify-content: flex-start;
  border-right: 1px solid $lineColor2;
  @media (max-width: 768px) {
    width: 100%;
    order: 0;
    border-right: none;
    border-bottom: 1px solid $lineColor2;
  }
  .section-kicker { margin-bottom: 0.3rem; }
}

.preview-heading {
  font-size: 20px;
  font-weight: 500;
  color: $darkBlue;
  line-height: 1.2;
  margin: 0 0 0.5rem;
}

.preview-desc {
  font-size: 1rem;
  color: $neutralGrey;
  line-height: 1.65;
  margin: 0 0 0.75rem;
}

.preview-btn {
  display: inline-flex;
  align-items: center;
  width: fit-content;
  margin-top: auto;
  font-size: 1rem;
  font-weight: 500;
  padding: 9px 18px;
  border-radius: 4px;
  background: $purple;
  border: none;
  color: #fff;
  text-decoration: none;
  transition: background 0.15s;
  &:hover { background: #9a00de; color: #fff; }
}

/* ── Find your path ── */
.path-section {
  background: $background;
  padding: 2rem max(2rem, calc((100% - 1280px) / 2)) 4rem;
}

.path-header {
  max-width: 770px;
  margin-bottom: 2.5rem;
}

.path-cards {
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: 1.25rem;
  @media (max-width: 768px) { grid-template-columns: 1fr; }
}

.path-card {
  background: #fff;
  border: 1px solid $lineColor2;
  border-radius: 4px;
  padding: 1.75rem 1.5rem;
  display: flex;
  flex-direction: column;
  gap: 0;
  transition: border-color 0.15s, background 0.15s, box-shadow 0.15s;
}

.path-card-icon {
  color: $purple;
}

.path-card-kicker-group {
  display: flex;
  justify-content: space-between;
}

.path-card-kicker {
  font-size: 1rem;
  font-weight: 600;
  letter-spacing: 0.1em;
  text-transform: uppercase;
  color: $purple;
}

.path-card-heading {
  font-size: 18px;
  font-weight: 600;
  color: $darkBlue;
  margin: 0 0 0.75rem;
}

.path-card-desc {
  font-size: 1rem;
  line-height: 1.65;
  color: $neutralGrey;
  margin: 0 0 1.5rem;
  flex: 1;
}

.path-card-btn {
  display: inline-flex;
  align-items: center;
  width: fit-content;
  font-size: 1rem;
  font-weight: 500;
  padding: 9px 18px;
  border-radius: 4px;
  background: $purple;
  border: none;
  color: #fff;
  text-decoration: none;
  transition: background 0.15s;
  margin-top: auto;
  &:hover { background: #9a00de; color: #fff; }
}
</style>
