<template>
  <Head>
    <Title>Metrics</Title>
    <Meta name="og:title" hid="og:title" content="Metrics" />
    <Meta name="twitter:title" content="Metrics" />
    <Meta name="description" hid="description" content="Browse Metrics" />
    <Meta name="og:description" hid="og:description" content="Browse Metrics" />
    <Meta name="twitter:description" content="Browse Metrics" />
  </Head>
  <div class="page-data pb-16">
    <breadcrumb :breadcrumb="breadcrumb" title="Metrics"/>
    <div class="container">
      <div class="search-tabs__container">
        <h1>
          Browse Metrics
        </h1>
        <ul class="search-tabs">
          <li v-for="type in metricsTypes" :key="type.label">
            <nuxt-link
              class="search-tabs__button"
              :class="{ active: type.type === $route.query.metricsType }"
              :to="{
                name: 'about-metrics',
                query: {
                  ...$route.query,
                  metricsType: type.type,
                }
              }"
            >
              {{ type.label }}
            </nuxt-link>
          </li>
        </ul>
      </div>
    </div>
    <div class="container mt-16">
      <user-behaviors
        v-if="$route.query.metricsType == 'userBehaviors'"
        :metrics-data="metricsData"
        :date-last-updated="dateLastUpdated"
      />
      <scientific-contribution
        v-else
        :metrics-data="metricsData"
        :date-last-updated="dateLastUpdated"
      />
    </div>
  </div>
</template>

<script>
import {
  compose,
  defaultTo,
  find,
  head,
  pathOr,
  propEq,
  propOr
} from 'ramda'
import { getPreviousDate } from '@/utils/common'
import UserBehaviors from '@/components/Metrics/UserBehaviors.vue'
import ScientificContribution from '@/components/Metrics/ScientificContribution.vue'

const metricsComponents = {
  userBehaviors: UserBehaviors,
  scientificContribution: ScientificContribution,
}

const metricsTypes = [
  {
    label: 'Scientific Contribution',
    type: 'scientificContribution',
    dataSource: ''
  },
  {
    label: 'User Behaviors',
    type: 'userBehaviors',
    dataSource: ''
  }
]

// Legacy enpoint for google analytics ga4
// Uses METRICS_URL_LEGACY env variable
const fetchLegacyGA4Metrics = async (config, month, year) => {
  try {
    const response = await $fetch(`${config.public.METRICS_URL_LEGACY}/ga4?year=${year}&month=${month}`)
    const responseData = JSON.parse(response)

    const ga4MetricsData = Array.isArray(responseData) ? responseData[0] : responseData

    const parseValue = (data, key) => {
      const value = data?.[key]
      if (!value) return 0
      if (typeof value === 'object' && value.N) {
        return parseInt(value.N) || 0
      }
      return parseInt(value) || 0
    }

    return {
      pageViewsData: {
        lastQuarter: [
          parseValue(ga4MetricsData, 'all_home_page_views_last_quarter'),
          parseValue(ga4MetricsData, 'all_find_data_page_views_last_quarter'),
          parseValue(ga4MetricsData, 'all_tools_resources_page_views_last_quarter'),
          parseValue(ga4MetricsData, 'all_maps_page_views_last_quarter'),
          parseValue(ga4MetricsData, 'all_news_events_page_views_last_quarter')
        ],
        lastMonth: [
          parseValue(ga4MetricsData, 'all_home_page_views_last_mo'),
          parseValue(ga4MetricsData, 'all_find_data_page_views_last_mo'),
          parseValue(ga4MetricsData, 'all_tools_resources_page_views_last_mo'),
          parseValue(ga4MetricsData, 'all_maps_page_views_last_mo'),
          parseValue(ga4MetricsData, 'all_news_events_page_views_last_mo')
        ]
      },
      usersData: {
        lastQuarter: [
          parseValue(ga4MetricsData, 'returning_users_in_last_quarter'),
          parseValue(ga4MetricsData, 'new_users_in_last_quarter')
        ],
        lastMonth: [
          parseValue(ga4MetricsData, 'returning_users_in_last_month'),
          parseValue(ga4MetricsData, 'new_users_in_last_month')
        ]
      }
    }
  } catch (err) {
    console.error('Error fetching legacy GA4 metrics:', err)
    return null
  }
}

// Legacy /sparc endpoint - new enpoint is single call, legacy needs 2
// Uses METRICS_URL_LEGACY env variable
const fetchLegacySparcMetrics = async (config, month, year) => {
  try {
    const response = await $fetch(`${config.public.METRICS_URL_LEGACY}/sparc?year=${year}&month=${month}`)
    const responseData = JSON.parse(response)

    const sparcMetricsData = Array.isArray(responseData) ? responseData[0] : responseData

    const parseValue = (data, key) => {
      const value = data?.[key]
      if (!value) return 0
      if (typeof value === 'object' && value.N) {
        return parseInt(value.N) || 0
      }
      return parseInt(value) || 0
    }

    const hasLegacyData = sparcMetricsData?.['all_sparc_categories_cumulative'] !== undefined

    if (!hasLegacyData) {
      console.warn('Legacy SPARC metrics fields not found in response')
      return null
    }

    return {
      dataChartLabels: ['All', 'Datasets', 'Anatomical Models', 'Computational Models', 'Embargoed (across all)'],
      dataChartData: {
        total: [
          parseValue(sparcMetricsData, 'all_sparc_categories_cumulative'),
          parseValue(sparcMetricsData, 'sparc_datasets_cumulative'),
          parseValue(sparcMetricsData, 'sparc_maps_cumulative'),
          parseValue(sparcMetricsData, 'sparc_computational_models_cumulative'),
          parseValue(sparcMetricsData, 'embargoed_overall')
        ]
      },
      anatomicalStructuresTotal: parseValue(sparcMetricsData, 'current_number_of_anatomical_structures')
    }
  } catch (err) {
    console.error('Error fetching legacy SPARC metrics:', err)
    return null
  }
}

const fetchTotalDatasetDownloads = async (url) => {
  const currentDate = new Date()
  const currentDay = currentDate.getDate().toString().padStart(2, '0')
  let currentMonth = currentDate.getMonth() + 1
  currentMonth = currentMonth.toString().padStart(2, '0')
  const currentYear = currentDate.getFullYear()
  const totalDownloadsUrl = `${url}/metrics/dataset/downloads/summary?startDate=2020-01-01&endDate=${currentYear}-${currentMonth}-${currentDay}`
  let totalDownloads = 0
  try {
    const response = await $fetch(totalDownloadsUrl)
    response.forEach(item => {
        if (item.origin === 'SPARC') {
          totalDownloads += parseInt(item['downloads'])
        }
    })
  } catch (err) {
    console.error('Error retrieving download count.', err)
  } finally {
    return totalDownloads
  }
}

const fetchMetrics = async (config, month, year) => {
  // Fetch all metrics from NEW metrics enpoint - single call
  const response = await $fetch(`${config.public.METRICS_URL}/sparc?year=${year}&month=${month}`)
  if(!response){return}
  const metricsArray = JSON.parse(response);
  // Extract each report type from the response array
  const algoliaData = metricsArray.find(item => item.Report === 'algolia') || {}
  const ga4MetricsData = metricsArray.find(item => item.Report === 'ga4') || {}
  const pennsieveMetricsData = metricsArray.find(item => item.Report === 'pennsieve') || {}


  const anatomyOrganName = algoliaData['anatomy.organ.name'] || {}
  let highlightedOrgans = []
  Object.keys(anatomyOrganName).forEach(key => highlightedOrgans.push({
    name: key,
    value: parseInt(anatomyOrganName[key]) || 0
  }))

  const totalDownloads = await fetchTotalDatasetDownloads(config.public.discover_api_host)

  // Calculate total anatomical structures from category breakdown
  const totalAnatomicalStructures = algoliaData['current_number_of_anatomical_structures'] || ""

  return {
    userBehaviors: {
      pageViewsLabels: ['Homepage', 'Find Data', 'Tools & Resources', 'Maps', 'News & Events'],
      pageViewsData: {
        // New endpoint provides quarterly data
        lastQuarter: [
          parseInt(ga4MetricsData['/']) || 0,
          parseInt(ga4MetricsData['/data']) || 0,
          parseInt(ga4MetricsData['/apps']) || 0,
          parseInt(ga4MetricsData['/apps/maps']) || 0,
          parseInt(ga4MetricsData['/news-and-events']) || 0
        ]
      },
      usersData: {
        lastQuarter: [
          parseInt(ga4MetricsData['returning']) || 0,
          parseInt(ga4MetricsData['new_users']) || 0
        ]
      },
      totalDownloadsData: {
        total: totalDownloads
      },
      datasetContributorsData: {
        total: parseInt(algoliaData['contributors.name']['countributors_count']) || 0
      },
    },
    scientificContribution: {
      samples: {
        total: parseInt(algoliaData['samples']) || 0,
      },
      subjects: {
        total: parseInt(algoliaData['subjects']) || 0,
      },
      anatomicalStructures: {
        total: totalAnatomicalStructures
      },
      anatomicalStructuresChartLabels: highlightedOrgans.map(structure => structure.name),
      anatomicalStructuresChartData: highlightedOrgans.map(structure => structure.value),
      fileStorage: {
        totalTB: (parseInt(pennsieveMetricsData['total_org_size_in_bytes']) || 0) / 1000000000000.0
      },
      contributors: {
        total: parseInt(algoliaData['contributors.name']?.['countributors_count']) || 0
      }
    }
  }
}

export default {
  name: 'MetricsPage',
  components: {
    UserBehaviors,
    ScientificContribution
  },
  async setup() {
    const config = useRuntimeConfig()
    const currentMonth = new Date().getMonth() + 1
    const currentYear = new Date().getFullYear()
    // we use last months date to get the metrics bc the metrics for the current month aren't published until the end of the month
    const lastMonthsDate = getPreviousDate(currentMonth, currentYear)
    let metricsData = undefined
    let dateLastUpdated
    try {
      // Fetch new metrics, legacy SPARC metrics (for cumulative chart data), and legacy GA4 metrics (for page views/user types)
      const [newMetrics, legacySparcMetrics, legacyGA4Metrics] = await Promise.all([
        fetchMetrics(config, lastMonthsDate.month, lastMonthsDate.year),
        fetchLegacySparcMetrics(config, lastMonthsDate.month, lastMonthsDate.year),
        fetchLegacyGA4Metrics(config, lastMonthsDate.month, lastMonthsDate.year)
      ])

      metricsData = newMetrics

      // Merge legacy GA4 data into userBehaviors for page views and user types charts (quarterly data)
      if (legacyGA4Metrics && metricsData?.userBehaviors) {
        metricsData.userBehaviors.pageViewsData = legacyGA4Metrics.pageViewsData
        metricsData.userBehaviors.usersData = legacyGA4Metrics.usersData
      }

      // Merge legacy SPARC data into scientificContribution for the first chart
      // New metrics data takes priority, legacy fills in missing cumulative fields
      if (legacySparcMetrics && metricsData?.scientificContribution) {
        metricsData.scientificContribution.dataChartLabels = legacySparcMetrics.dataChartLabels
        metricsData.scientificContribution.dataChartData = legacySparcMetrics.dataChartData
        // Use legacy anatomicalStructures total if new one is empty
        if (!metricsData.scientificContribution.anatomicalStructures?.total && legacySparcMetrics.anatomicalStructuresTotal) {
          metricsData.scientificContribution.anatomicalStructures = {
            total: legacySparcMetrics.anatomicalStructuresTotal
          }
        }
      }

      dateLastUpdated = new Date(`${lastMonthsDate.month}/01/${lastMonthsDate.year}`)
    } catch (e) {
      const monthBeforeLastDate = getPreviousDate(lastMonthsDate.month, lastMonthsDate.year)

      const [newMetrics, legacySparcMetrics, legacyGA4Metrics] = await Promise.all([
        fetchMetrics(config, monthBeforeLastDate.month, monthBeforeLastDate.year),
        fetchLegacySparcMetrics(config, monthBeforeLastDate.month, monthBeforeLastDate.year),
        fetchLegacyGA4Metrics(config, monthBeforeLastDate.month, monthBeforeLastDate.year)
      ])

      metricsData = newMetrics

      // Merge legacy GA4 data into userBehaviors for page views and user types charts (quarterly data)
      if (legacyGA4Metrics && metricsData?.userBehaviors) {
        metricsData.userBehaviors.pageViewsData = legacyGA4Metrics.pageViewsData
        metricsData.userBehaviors.usersData = legacyGA4Metrics.usersData
      }

      if (legacySparcMetrics && metricsData?.scientificContribution) {
        metricsData.scientificContribution.dataChartLabels = legacySparcMetrics.dataChartLabels
        metricsData.scientificContribution.dataChartData = legacySparcMetrics.dataChartData
        if (!metricsData.scientificContribution.anatomicalStructures?.total && legacySparcMetrics.anatomicalStructuresTotal) {
          metricsData.scientificContribution.anatomicalStructures = {
            total: legacySparcMetrics.anatomicalStructuresTotal
          }
        }
      }

      dateLastUpdated = new Date(`${monthBeforeLastDate.month}/01/${monthBeforeLastDate.year}`)
    }
    return {
      metricsData,
      dateLastUpdated
    }
  },

  data: () => {
    return {
      metricsTypes,
      isLoadingMetrics: false,
      searchFailed: false,
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

  computed: {
    /**
     * Compute search type
     * @returns {String}
     */
    searchType: function() {
      const metricsTypeQuery = pathOr('', ['query', 'metricsType'], this.$route)
      const metricsType = find(propEq('type', metricsTypeQuery), this.metricsTypes)

      return defaultTo(head(this.metricsTypes), metricsType)
    },

    /**
     * Compute which search results component to display based on the type of search
     * @returns {Function}
     */
    metricsComponent: function() {
      return defaultTo('', metricsComponents[this.$route.query.metricsType])
    },
  },
  /**
   * Check the metricsType param in the route and set it if it
   */
  mounted: function() {
    if (!this.$route.query.metricsType) {
      const firstTabType = compose(propOr('', 'type'), head)(metricsTypes)
      this.$router.replace({ query: { metricsType: firstTabType } })
    }
  },
}
</script>

<style scoped lang="scss">
@import 'sparc-design-system-components-2/src/assets/_variables.scss';

.page-data {
  background-color: $background;
}
.search-tabs__container {
  margin-top: 2rem;
  padding-top: 0.5rem;
  background-color: white;
  border: 0.1rem solid $lineColor2;
  h1 {
    padding-left: 0.75rem;
    font-weight: 600;
    font-size: 1.5rem;
    line-height: 2.75rem;
    margin: 0 0 0.5rem;
  }
}
.search-tabs {
  display: flex;
  list-style: none;
  overflow: auto;
  margin: 0 0 0 0;
  padding: 0 0;
  outline: 0.1rem solid $purple;
  @media (max-width: 40rem) {
    display: block;
  }
  li {
    width: 100%;
    text-align: center;
    color: $purple;
  }
  li:last-child > a {
    border-right: none;
  }
}
.search-tabs__button {
  background: #f9f2fc;
  display: block;
  font-size: 0.75rem;
  font-weight: 500;
  outline: none;
  padding: 0;
  text-decoration: none;
  text-transform: uppercase;
  line-height: 3.5rem;
  @media (min-width: 40rem) {
    font-size: 0.65rem;
    border-right: 0.1rem solid $purple;
  }
  @media (min-width: 50rem) {
    font-size: .75rem;
  }
  @media (min-width: 64rem) {
    font-size: 1.25rem;
    font-weight: 600;
    text-transform: none;
  }
  &:hover,
  &.active {
    color: white;
    background-color: $purple;
    font-weight: 500;
  }
}
.table-wrap {
  background: white;
  border: 1px solid $lineColor2;
  padding: 1rem;
  .search-error {
    margin: 0 0  auto;
    text-align:center;
  }
}
</style>
