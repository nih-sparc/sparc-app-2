<template>
  <div class="page-data">
    <div class="home-hero">
      <div class="hero-inner">
        <div class="hero-eyebrow">{{ heroEyebrow }}</div>
        <!-- eslint-disable vue/no-v-html -->
        <h1 class="hero-h1" v-if="heroHeading">{{ heroHeading }}</h1>
        <div class="hero-sub" v-html="parseMarkdown(heroCopy)" />
        <div class="hero-btns">
          <nuxt-link :to="heroButtonLink || '/data?type=dataset'" class="hero-btn-primary">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" width="14" height="14">
              <ellipse cx="12" cy="6" rx="8" ry="3"/>
              <path d="M4 6v6c0 1.66 3.58 3 8 3s8-1.34 8-3V6"/>
              <path d="M4 12v6c0 1.66 3.58 3 8 3s8-1.34 8-3v-6"/>
            </svg>
            {{ heroButtonLabel || 'Access' }}
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
          :src="heroImage?.fields?.file?.url || 'https://images.ctfassets.net/6bya4tyw8399/1vTvDLvi5CPAy9vqI7UjrB/7fa18b8c0fe2dc2f4a739b24e9dfb884/transparent-hero.png'"
          alt="SPARC nervous system infographic"
          class="hero-image"
        />
      </div>
    </div>

    <!-- Interactive Map Section -->
    <div class="map-section">
      <div class="map-header">
        <div class="section-kicker">{{ mapEyebrow }}</div>
        <h2 class="section-h2">{{ mapHeading }}</h2>
        <p class="section-sub">{{ mapKicker }}</p>
      </div>
      <div class="map-card">
        <div class="homepage-navigator-video">
          <video
            class="navigator-video"
            :src="mapVideoUrl"
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
        <div class="section-kicker">{{ exploreEyebrow }}</div>
        <h2 class="section-h2">{{ exploreHeading }}</h2>
        <p class="section-sub">{{ exploreKicker }}</p>
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
        <div class="section-kicker">{{ toolsEyebrow }}</div>
        <h2 class="section-h2">{{ toolsHeading }}</h2>
        <p class="section-sub">{{ toolsKicker }}</p>
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
            <img v-if="tab.iconUrl" class="tool-tab-icon" :src="tab.iconUrl" alt="" aria-hidden="true" />
            <span class="tool-tab-label">{{ tab.label }}</span>
          </button>
        </div>
        <div class="tools-previews" @mouseenter="stopToolTabCycle" @mouseleave="startToolTabCycle">
          <div
            v-for="tab in toolTabs"
            :key="tab.id"
            class="tools-preview"
            :class="[`tools-preview--${tab.id}`, { 'tools-preview--hidden': activeToolTab !== tab.id }]"
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
      <div class="section-kicker">{{ pathEyebrow }}</div>
      <h2 class="section-h2">{{ pathHeading }}</h2>
      <p class="section-sub">{{ pathKicker }}</p>
    </div>
    <div class="path-cards">

      <div v-for="card in pathCards" :key="card.id" class="path-card">
        <div class="path-card-kicker-group">
          <div class="path-card-kicker">{{ card.kicker }}</div>
          <div class="path-card-icon">
            <img v-if="card.iconUrl" :src="card.iconUrl" alt="" class="path-card-icon-img" />
          </div>
        </div>
        <h3 class="path-card-heading">{{ card.heading }}</h3>
        <p class="path-card-desc">{{ card.desc }}</p>
        <a v-if="card.external" :href="card.href" target="_blank" rel="noopener" class="path-card-btn">
          {{ card.btnLabel }}
          <svg viewBox="0 0 12 12" width="11" height="11" fill="none" style="margin-left:6px;flex-shrink:0"><path d="M2 10L10 2M10 2H4M10 2v6" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"/></svg>
        </a>
        <nuxt-link v-else :to="card.href" class="path-card-btn">
          {{ card.btnLabel }}
          <svg viewBox="0 0 12 12" width="11" height="11" fill="none" style="margin-left:6px;flex-shrink:0"><path d="M2 10L10 2M10 2H4M10 2v6" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"/></svg>
        </nuxt-link>
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
import { useRuntimeConfig, useAsyncData } from '#app'

const config = useRuntimeConfig()
const { $algoliaClient } = useNuxtApp()
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
    
const _homepageCache = useState('_homepageCache', () => null)
const { data: homepageData, error: homepageError } = useAsyncData('homepage', async () => {
  const result = await $fetch('/api/contentful/homepage')
  _homepageCache.value = result
  return result
}, { getCachedData: () => _homepageCache.value || undefined })

const fields = computed(() => {
  if (!homepageData.value) return null;
  return getHomepageFields(homepageData.value?.fields);
})

const heroEyebrow = computed(() => fields.value?.heroEyebrow)
const heroHeading = computed(() => fields.value?.heroHeading)
const heroImage = computed(() => fields.value?.heroImage)
const heroCopy = computed(() => fields.value?.heroCopy)
const heroButtonLabel = computed(() => fields.value?.heroButtonLabel)
const heroButtonLink = computed(() => fields.value?.heroButtonLink)

const mapEyebrow = computed(() => fields.value?.mapEyebrow)
const mapHeading = computed(() => fields.value?.mapHeading)
const mapKicker = computed(() => fields.value?.mapKicker)
const mapVideoUrl = computed(() => fields.value?.mapVideo?.fields?.file?.url)

const exploreEyebrow = computed(() => fields.value?.exploreEyebrow)
const exploreHeading = computed(() => fields.value?.exploreHeading)
const exploreKicker = computed(() => fields.value?.exploreKicker)

const toolsEyebrow = computed(() => fields.value?.toolsEyebrow)
const toolsHeading = computed(() => fields.value?.toolsHeading)
const toolsKicker = computed(() => fields.value?.toolsKicker)

const pathEyebrow = computed(() => fields.value?.pathEyebrow)
const pathHeading = computed(() => fields.value?.pathHeading)
const pathKicker = computed(() => fields.value?.pathKicker)

const isExternalLink = (href) => /^https?:\/\//.test(href || '')

const pathCards = computed(() => {
  return (fields.value?.paths || []).map(path => ({
    id: path.sys.id,
    kicker: path.fields?.eyebrow || '',
    iconUrl: path.fields?.icon?.fields?.file?.url,
    heading: path.fields?.title || '',
    desc: path.fields?.description || '',
    btnLabel: path.fields?.buttonText || '',
    href: path.fields?.buttonLink || '',
    external: isExternalLink(path.fields?.buttonLink),
  }))
})

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

const toolTabs = computed(() => {
  return (fields.value?.tools || []).map(tool => ({
    id: tool.sys.id,
    label: tool.fields?.title || '',
    iconUrl: tool.fields?.icon?.fields?.file?.url,
    video: tool.fields?.video?.fields?.file?.url,
    image: tool.fields?.placeholderImage?.fields?.file?.url,
    kicker: tool.fields?.eyebrow || '',
    heading: tool.fields?.header || '',
    desc: tool.fields?.description || '',
    href: tool.fields?.href || '',
    external: tool.fields?.external || false,
    btnLabel: tool.fields?.buttonLabel || '',
  }))
})
const selectedToolTab = ref(null)
const activeToolTab = computed(() => selectedToolTab.value || toolTabs.value[0]?.id || null)

let toolTabCycleTimer = null
const stopToolTabCycle = () => {
  clearInterval(toolTabCycleTimer)
  toolTabCycleTimer = null
}
const startToolTabCycle = () => {
  clearInterval(toolTabCycleTimer)
  toolTabCycleTimer = setInterval(() => {
    const tabs = toolTabs.value
    if (!tabs.length) return
    const index = tabs.findIndex(tab => tab.id === activeToolTab.value)
    selectedToolTab.value = tabs[(index + 1) % tabs.length].id
  }, 10000)
}
const selectToolTab = (id) => {
  selectedToolTab.value = id
  startToolTabCycle()
}
onMounted(startToolTabCycle)
onBeforeUnmount(() => clearInterval(toolTabCycleTimer))

// Preview button labels come from Contentful and vary in length — rather than
// wrapping or overflowing the fixed-width preview column, shrink the font
// size just enough for each label to fit on one line.
const MIN_PREVIEW_BTN_FONT_SIZE = 12
const shrinkPreviewButtonText = async () => {
  await nextTick()
  const rootFontSize = parseFloat(getComputedStyle(document.documentElement).fontSize) || 16
  document.querySelectorAll('.tools-section .preview-btn').forEach(btn => {
    btn.style.fontSize = ''
    const parentStyle = getComputedStyle(btn.parentElement)
    const available = btn.parentElement.clientWidth - parseFloat(parentStyle.paddingLeft) - parseFloat(parentStyle.paddingRight)
    let fontSize = rootFontSize
    while (btn.scrollWidth > available && fontSize > MIN_PREVIEW_BTN_FONT_SIZE) {
      fontSize -= 1
      btn.style.fontSize = `${fontSize}px`
    }
  })
}
watch(toolTabs, shrinkPreviewButtonText)
onMounted(shrinkPreviewButtonText)

let previewBtnResizeTimer = null
const handlePreviewBtnResize = () => {
  clearTimeout(previewBtnResizeTimer)
  previewBtnResizeTimer = setTimeout(shrinkPreviewButtonText, 150)
}
onMounted(() => window.addEventListener('resize', handlePreviewBtnResize))
onBeforeUnmount(() => {
  clearTimeout(previewBtnResizeTimer)
  window.removeEventListener('resize', handlePreviewBtnResize)
})


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
  object-fit: contain;
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
  max-width: 100%;
  width: fit-content;
  white-space: nowrap;
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

.path-card-icon-img {
  display: block;
  width: 28px;
  height: 28px;
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
