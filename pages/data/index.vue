<template>
  <div class="page-data">
    <breadcrumb :breadcrumb="breadcrumb" :title="searchType.label" />
    <div class="container">
      <div class="search-tabs__container">
        <div class="heading2 pl-8 mb-8">
          Browse categories
        </div>
        <ul class="search-tabs">
          <li v-for="type in searchTypes" :key="type.label">
            <nuxt-link
              class="search-tabs__button"
              :class="{ active: type.type === $route.query.type }"
              :to="{
                name: 'data',
                query: {
                  ...$route.query,
                  type: type.type,
                }
              }"
            >
              {{ type.label }}
            </nuxt-link>
          </li>
        </ul>
      </div>
      <div class="search-bar__container">
        <div class="body1 mb-8">
          Search within category
        </div>
        <search-controls-contentful
          class="search-bar"
          placeholder="Enter search criteria"
          :path="$route.path"
          showSearchText
        />
      </div>
    </div>
    <div class="container">
      <el-row :gutter="32" type="flex">
        <el-col :span="24">
          <el-row :gutter="32">
            <client-only>
              <el-col
                v-if="searchType.type === 'dataset' || searchType.type === 'model' || searchType.type === 'simulation'"
                class="facet-menu"
                :sm="24"
                :md="8"
                :lg="6"
              >
                <dataset-facet-menu
                  :facets="facets"
                  :visible-facets="visibleFacets"
                  @selected-facets-changed="onPaginationPageChange(1)"
                  @hook:mounted="facetMenuMounted"
                  ref="datasetFacetMenu"
                />
              </el-col>
              <el-col
                v-else-if="searchType.type === 'projects'"
                class="facet-menu"
                :sm="24"
                :md="8"
                :lg="6"
              >
                <projects-facet-menu
                  :anatomicalFocusFacets="projectsAnatomicalFocusFacets"
                  :fundingFacets="projectsFundingFacets"
                  @projects-selections-changed="onPaginationPageChange(1)"
                  @hook:mounted="facetMenuMounted"
                  ref="projectsFacetMenu"
                />
              </el-col>
              <el-col
                :sm="searchColSpan('sm')"
                :md="searchColSpan('md')"
                :lg="searchColSpan('lg')"
              >
                <div class="search-heading">
                  <p v-show="!isLoadingSearch && searchData.items.length">
                    {{ searchData.total }} Results | Showing
                    <pagination-menu
                      :page-size="searchData.limit"
                      @update-page-size="updateDataSearchLimit"
                    />
                  </p>
                  <span v-if="searchType.type !== 'projects' && searchData.items.length" class="label1">
                    Sort
                    <sort-menu
                      :options="algoliaSortOptions"
                      :selected-option="selectedAlgoliaSortOption"
                      @update-selected-option="onAlgoliaSortOptionChange"
                    />
                  </span>
                  <span v-else-if="searchType.type == 'projects'" class="label1">
                    Sort
                    <sort-menu
                      :options="projectsSortOptions"
                      :selected-option="selectedProjectsSortOption"
                      @update-selected-option="onProjectsSortOptionChange"
                    />
                  </span>
                </div>
                <div v-loading="isLoadingSearch" class="table-wrap">
                  <p v-if="searchFailed" class="search-error">
                    Sorry, the search engine has encountered an unexpected
                    error, please try again later.
                  </p>
                  <dataset-search-results
                    v-else-if="searchType.type !== 'projects'"
                    :tableData="tableData"
                  />
                  <project-search-results
                    v-else-if="searchType.type == 'projects'"
                    :tableData="tableData"
                  />

                  <div v-if="searchHasAltResults" class="mt-24">
                    <template v-if="searchData.total === 0">
                      No results were found for <strong>{{ searchType.label }}</strong>.
                    </template>
                    The following results were discovered for the other categories:
                    <br />
                    <br />
                    <template v-for="dataType in dataTypes">
                      <dd v-if="resultCounts[dataType] > 0 && dataType !== 'projects'" :key="dataType">
                        <nuxt-link
                          class="alternative-links"
                          :to="{
                            name: 'data',
                            query: {
                              ...$route.query,
                              type: dataType
                            }
                          }"
                        >
                          {{ resultCounts[dataType] }} result{{
                            resultCounts[dataType] > 1 ? 's' : ''
                          }}
                        </nuxt-link>
                        - {{ humanReadableDataTypesLookup[dataType] }}
                      </dd>
                    </template>
                  </div>
                </div>
                <div class="search-heading">
                  <p v-if="!isLoadingSearch && searchData.items.length">
                    {{ searchHeading }} | Showing
                    <pagination-menu
                      :page-size="searchData.limit"
                      @update-page-size="updateDataSearchLimit"
                    />
                  </p>
                  <pagination
                    v-if="searchData.limit < searchData.total"
                    :selected="curSearchPage"
                    :page-size="searchData.limit"
                    :total-count="searchData.total"
                    @select-page="onPaginationPageChange"
                  />
                </div>
              </el-col>
            </client-only>
          </el-row>
        </el-col>
      </el-row>
    </div>
  </div>
</template>

<script>
import { ref } from 'vue'
import {
  clone,
  compose,
  defaultTo,
  find,
  head,
  mergeLeft,
  pathOr,
  propOr
} from 'ramda'
import PageHero from '@/components/PageHero/PageHero.vue'
import SearchControlsContentful from '@/components/SearchControlsContentful/SearchControlsContentful.vue'
import DatasetFacetMenu from '@/components/FacetMenu/DatasetFacetMenu.vue'
import ProjectsFacetMenu from '@/components/FacetMenu/ProjectsFacetMenu.vue'
import { facetPropPathMapping, getAlgoliaFacets } from '../../utils/algolia'
import { HIGHLIGHT_HTML_TAG } from '../../utils/utils'
import DatasetSearchResults from '@/components/SearchResults/DatasetSearchResults.vue'
import ProjectSearchResults from '@/components/SearchResults/ProjectSearchResults.vue'
import SortMenu from '@/components/SortMenu/SortMenu.vue'

const searchResultsComponents = {
  dataset: DatasetSearchResults,
  projects: ProjectSearchResults,
  simulation: DatasetSearchResults,
  model: DatasetSearchResults
}

const searchTypes = [
  {
    label: 'Datasets',
    type: 'dataset',
    dataSource: 'algolia'
  },
  {
    label: 'Anatomical Models',
    type: 'model',
    dataSource: 'algolia'
  },
  {
    label: 'Computational Models',
    type: 'simulation',
    dataSource: 'algolia'
  },
  {
    label: 'Projects',
    type: 'projects',
    dataSource: 'contentful'
  }
]

const projectsSortOptions = [
  {
    label: 'A-Z',
    id: 'alphabatical',
    sortOrder: 'fields.title'
  },
  {
    label: 'Z-A',
    id: 'reverseAlphabatical',
    sortOrder: '-fields.title'
  },
]

export default {
  name: 'DataPage',

  components: {
    PageHero,
    SearchControlsContentful,
    DatasetFacetMenu,
    DatasetSearchResults,
    SortMenu,
    ProjectsFacetMenu,
    ProjectSearchResults
  },

  async setup() {
    const config = useRuntimeConfig()
    const { $algoliaClient, $contentfulClient } = useNuxtApp()
    const algoliaSortOptions = [
      {
        label: 'Published (desc)',
        id: 'newest',
        algoliaIndexName: config.public.ALGOLIA_INDEX_PUBLISHED_TIME_DESC
      },
      {
        label: 'Published (asc)',
        id: 'oldest',
        algoliaIndexName: config.public.ALGOLIA_INDEX_PUBLISHED_TIME_ASC
      },
      {
        label: 'A-Z',
        id: 'alphabatical',
        algoliaIndexName: config.public.ALGOLIA_INDEX_ALPHABETICAL_A_Z
      },
      {
        label: 'Z-A',
        id: 'reverseAlphabatical',
        algoliaIndexName: config.public.ALGOLIA_INDEX_ALPHABETICAL_Z_A
      },
    ]
    const selectedAlgoliaSortOption = ref(algoliaSortOptions[0])
    const algoliaIndex = await $algoliaClient.initIndex(config.public.ALGOLIA_INDEX_PUBLISHED_TIME_DESC)

    let projectsAnatomicalFocusFacets = []
    let projectsFundingFacets = []
    await $contentfulClient.getEntries({
        content_type: 'awardSection',
      })
      .then(async response => {
        let facetData = []
        const items = propOr([], 'items', response)
        items.forEach(item => {
          const label = pathOr('', ['fields','title'], item)
          facetData.push({
            label: label,
            id: label,
          })
        })
        projectsAnatomicalFocusFacets = facetData
      })
      await $contentfulClient.getContentType('sparcAward').then(contentType => {
      contentType.fields.forEach((field) => {
        if (field.name === 'Funding') {
          let fundingItems = field.items?.validations[0]['in']
          let facetData = []
          fundingItems.forEach(itemLabel => {
            facetData.push({
              label: itemLabel,
              id: itemLabel,
            })
          })
          projectsFundingFacets = facetData
        }
      })
    })
    return {
      algoliaSortOptions,
      selectedAlgoliaSortOption,
      algoliaIndex,
      projectsAnatomicalFocusFacets,
      projectsFundingFacets
    }
  },

  head() {
    return {
      title: propOr("", "label", this.breadcrumb[this.breadcrumb.length - 1]),
      meta: [
        {
          hid: 'og:title',
          property: 'og:title',
          content: propOr("", "label", this.breadcrumb[this.breadcrumb.length - 1]),
        },
        {
          hid: 'description',
          name: 'description',
          content: 'Browse datasets'
        },
      ]
    }
  },

  data: () => {
    return {
      selectedProjectsSortOption: projectsSortOptions[0],
      projectsSortOptions,
      searchQuery: '',
      searchData: {
        limit: 10,
        skip: 0,
        items: [],
        total: 0
      },
      facets: [],
      dataTypes: ['dataset', 'simulation', 'model', 'projects'],
      humanReadableDataTypesLookup: {
        dataset: 'Datasets',
        model: 'Anatomical Models',
        simulation: 'Computational Models',
      },
      resultCounts: {
        model: 0,
        dataset: 0,
        simulation: 0,
      },
      searchHasAltResults: false,
      visibleFacets: {},
      isLoadingSearch: false,
      searchFailed: false,
      isSearchMapVisible: false,
      latestSearchTerm: '',
      searchTypes: searchTypes,
      breadcrumb: [
        {
          to: {
            name: 'index'
          },
          label: 'Home'
        },
        {
          to: {
            name: 'data',
            query: {
              type: 'dataset'
            }
          },
          label: 'Data & Models'
        },
      ],
      titleColumnWidth: 300,
      windowWidth: ''
    }
  },

  computed: {
    searchType: function() {
      const searchTypeQuery = pathOr('', ['query', 'type'], this.$route)
      const searchType = this.searchTypes.find(searchType => {
        return searchType.type == searchTypeQuery
      })

      return defaultTo(head(this.searchTypes), searchType)
    },

    tableData: function() {
      return propOr([], 'items', this.searchData)
    },

    searchResultsComponent: function() {
      return defaultTo('', searchResultsComponents[this.$route.query.type])
    },

    curSearchPage: function() {
      return this.searchData.skip / this.searchData.limit + 1
    },

    searchHeading: function() {
      const query = pathOr('', ['query', 'search'], this.$route)

      const searchType = this.searchTypes.find(searchType => {
        return searchType.type == this.$route.query.type
      })
      const searchTypeLabel = propOr('', 'label', searchType)

      let searchHeading = `${this.searchData.total} ${searchTypeLabel}`

      return query === '' ? searchHeading : `${searchHeading} for “${query}”`
    },

    search: function() {
      return this.$route.query.search || ''
    },

    isMobile: function() {
      return this.windowWidth <= 500
    }
  },

  watch: {
    '$route.query.type': function(val) {
      if (!this.$route.query.type) {
        const firstTabType = compose(propOr('', 'type'), head)(searchTypes)
        this.$router.replace({ query: { type: firstTabType } })
      } else {
        this.searchData = {
          limit: 10,
          skip: 0,
          items: [],
          total: 0
        }
        this.fetchResults()
      }
    },

    '$route.query.search': {
      handler: function() {
        this.searchQuery = this.$route.query.search
        this.fetchResults()
      },
      immediate: true
    },

    selectedAlgoliaSortOption: function(option) {
      this.algoliaIndex = this.$algoliaClient.initIndex(option.algoliaIndexName)
    }
  },

  beforeMount: function() {
    this.windowWidth = window.innerWidth
  },
  mounted: function() {
    if (!this.$route.query.type) {
      const firstTabType = compose(propOr('', 'type'), head)(searchTypes)
      this.$router.replace({ query: { type: firstTabType } })
    } else {
      const queryParams = {
        skip: Number(this.$route.query.skip || this.searchData.skip),
        limit: Number(this.$route.query.limit || this.searchData.limit),
        search: this.$route.query.search || ''
      }

      this.searchData = { ...this.searchData, ...queryParams }
    }
    if (window.innerWidth <= 768) this.titleColumnWidth = 150
    window.onresize = () => this.onResize(window.innerWidth)
    getAlgoliaFacets(this.algoliaIndex, facetPropPathMapping).then(data => this.facets = data).finally(() => {
      this.fetchResults()
    })
  },

  methods: {
    updateDataSearchLimit: function(limit) {
      this.searchData.skip = 0

      const newLimit = limit === 'View All' ? this.searchData.total : limit

      this.searchData.limit = newLimit
      this.$router.replace({
        query: { ...this.$route.query, limit: newLimit, skip: 0 }
      })
      this.fetchResults()
    },

    fetchResults: function() {
      const source = propOr('contentful', 'dataSource', this.searchType)

      const searchSources = {
        contentful: this.fetchFromContentful,
        algolia: this.fetchFromAlgolia
      }

      if (typeof searchSources[source] === 'function') {
        this.$nextTick(() => searchSources[source]())
      }
    },

    facetMenuMounted: function() {
      this.fetchResults()
    },

    fetchFromAlgolia: function() {
      this.isLoadingSearch = true
      this.searchFailed = false
      const query = this.$route.query.search

      const searchType = pathOr('dataset', ['query', 'type'], this.$route)
      const datasetsFilter =
        searchType === 'simulation' ? '(NOT item.types.name:Dataset AND NOT item.types.name:Scaffold)' 
          : searchType === 'model' ? '(NOT item.types.name:Dataset AND item.types.name:Scaffold)' 
          : "item.types.name:Dataset"

      /* First we need to find only those facets that are relevant to the search query.
       * If we attempt to do this in the same search as below than the response facets
       * will only contain those specified by the filter */
        this.latestSearchTerm = query     
        this.algoliaIndex
          .search(query, {
            facets: ['*'],
            filters: `${datasetsFilter}`
          })
          .then(response => {
            this.visibleFacets = response.facets
          })
          .catch(() => {
            this.isLoadingSearch = false
            this.searchFailed = true
          })
          .finally(() => {
            var filters =  this.$refs.datasetFacetMenu?.getFilters()
            filters = filters === undefined ? 
              `${datasetsFilter}` : 
              filters + ` AND ${datasetsFilter}`

            this.algoliaIndex
              .search(query, {
                facets: ['*'],
                hitsPerPage: this.searchData.limit,
                page: this.curSearchPage - 1,
                filters: filters,
                attributesToHighlight: [
                  'item.name',
                  'item.description',
                  'item.modalities',
                  'anatomy.organ',
                  'organisms.primary.species.name'
                ],
                highlightPreTag: `<${HIGHLIGHT_HTML_TAG}>`,
                highlightPostTag: `</${HIGHLIGHT_HTML_TAG}>`
              })
              .then(response => {
                const searchData = {
                  items: response.hits,
                  total: response.nbHits
                }
                this.searchData = mergeLeft(searchData, this.searchData)
                this.isLoadingSearch = false

                // Update alternative search results
                this.alternativeSearchUpdate()
              })
              .catch(() => {
                this.isLoadingSearch = false
                this.searchFailed = true
              })
          }) 
    },

    // alternaticeSearchUpdate: Updates this.resultCounts which is used for displaying other search options to the user
    //    when a search returns 0 results
    alternativeSearchUpdate: function() {
      const searchTypeInURL = pathOr('dataset', ['query', 'type'], this.$route) // Get current data type

      this.searchHasAltResults = false
      for (let key in this.resultCounts) { // reset reults list
        this.resultCounts[key] = 0
      }
      let altSearchTypes = this.dataTypes.filter(e => e !== searchTypeInURL) // Remove from list of data types

      altSearchTypes.forEach(type => {  // Search on each data type remaining
        this.searchContentsCheck(type)
      })
    },

    //  searchContentsCheck(searchType): Takes in a search type and returns the number of datasets found with the current filters
    searchContentsCheck: function(searchType) {
      const query = this.$route.query.search

      if (searchType !== 'projects'){

        // Alogilia searches
        const datasetsFilter =
          searchType === 'simulation' ? '(NOT item.types.name:Dataset AND NOT item.types.name:Scaffold)' 
            : searchType === 'model' ? '(NOT item.types.name:Dataset AND item.types.name:Scaffold)' 
            : "item.types.name:Dataset"

        var filters = this.$refs.datasetFacetMenu?.getFilters()
        filters = filters === undefined ? 
          `${datasetsFilter}` : 
          filters + ` AND ${datasetsFilter}`

        this.algoliaIndex
          .search(query, {
            facets: ['*'],
            filters: filters
          })
          .then(response => {
            response.nbHits > 0 ? (this.searchHasAltResults = true) : null
            this.resultCounts[searchType] = response.nbHits
          })
      }
    },

    fetchFromContentful: function() {
      this.isLoadingSearch = true

      var contentType = this.$route.query.type  
      var sortOrder = undefined
      var anatomicalFocus = undefined
      var funding = undefined
      var linkedEntriesTargetType = undefined
      if (this.$route.query.type === "projects") {
        contentType = 'sparcAward',
        sortOrder = this.selectedProjectsSortOption.sortOrder,
        anatomicalFocus = this.$refs.projectsFacetMenu?.getSelectedAnatomicalFocusTypes()
        funding = this.$refs.projectsFacetMenu?.getSelectedFundingTypes()
        linkedEntriesTargetType = 'awardSection'
      }
      if (contentType === undefined) {
        this.isLoadingSearch = false
      }
      else {
        this.$contentfulClient
          .getEntries({
            content_type: contentType,
            query: this.$route.query.search,
            limit: this.searchData.limit,
            skip: this.searchData.skip,
            order: sortOrder,
            include: 2,
            'fields.projectSection.sys.contentType.sys.id': linkedEntriesTargetType,
            'fields.projectSection.fields.title[in]' : anatomicalFocus,
            'fields.program[in]': funding
          })
          .then(async response => {
            this.searchData = { ...response }
            // Update alternative search results
            this.alternativeSearchUpdate()
          })
          .catch(() => {
            this.searchData = clone(searchData)
          })
          .finally(() => {
            this.isLoadingSearch = false
          })
      }
    },

    onPaginationPageChange: function(page) {
      const offset = (page - 1) * this.searchData.limit
      this.searchData.skip = offset

      this.$router.replace({
        query: { ...this.$route.query, skip: offset }
      })

      this.fetchResults()
    },

    onMapClick: function(label) {
      const { query } = this.$route
      const labelKey = label.toLowerCase()

      // short circuit if nothing has changed
      if (
        query.tags === labelKey ||
        find(t => t === labelKey, (query.tags || '').split(','))
      ) {
        return
      }

      const newTags = query.tags ? [query.tags, labelKey].join(',') : labelKey

      this.$router
        .replace({
          query: {
            ...query,
            tags: newTags
          }
        })
        .then(() => {
          this.fetchResults()
        })
    },

    onResize: function(width) {
      width <= 768
        ? (this.titleColumnWidth = 150)
        : (this.titleColumnWidth = 300)
      this.windowWidth = width
    },

    searchColSpan(viewport) {
      const hasFacetMenu = this.searchType.type === 'dataset' ||
        this.searchType.type === 'simulation' ||
        this.searchType.type === 'model' ||
        this.searchType.type === 'projects'
      const viewports = {
        sm: hasFacetMenu ? 24 : 24,
        md: hasFacetMenu ? 16 : 24,
        lg: hasFacetMenu ? 18 : 24
      }

      return viewports[viewport] || 24
    },
    
    async onAlgoliaSortOptionChange(option) {
      this.selectedAlgoliaSortOption = option
      this.onPaginationPageChange(1)
    },
    async onProjectsSortOptionChange(option) {
      this.selectedProjectsSortOption = option
      this.onPaginationPageChange(1)
    }
  }
}
</script>

<style scoped lang="scss">
@import 'sparc-design-system-components-2/src/assets/_variables.scss';
.alternative-links {
  text-decoration: underline;
  color: $purple;
}
.page-data {
  background-color: $background;
}
.page-hero {
  padding-bottom: 1.3125em;
}
.search-tabs__container {
  margin-top: 2rem;
  padding-top: 0.5rem;
  background-color: white;
  border: 0.1rem solid $lineColor2;
  h3 {
    padding-left: 0.75rem;
    font-weight: 600;
    font-size: 1.5rem;
  }
}
.search-bar__container {
  margin-top: 1em;
  padding: 0.75rem;
  border: 0.1rem solid $lineColor2;
  background: white;
  h5 {
    line-height: 1rem;
    font-weight: 600;
    font-size: 1rem;
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
  color: $purple;
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
  background: #fff;
  border: 1px solid $lineColor2;
  padding: 16px;
  .search-error {
    margin: 0 0  auto;
    text-align:center;
  }
}
.search-heading {
  align-items: flex-end;
  display: flex;
  margin-bottom: 1em;
  justify-content: space-between;
  @media screen and (max-width: 28em) {
    flex-direction: column;
    align-items: flex-start;
    margin-bottom: 0;
  }
  p {
    font-size: 0.875em;
    flex-shrink: 0;
    margin: 2em 0 0 0;
  }
}
.facet-menu {
  margin-top: 2em;
}
:deep(.el-table td) {
  vertical-align: top;
}
:deep(.el-table .cell) {
  word-break: normal;
}
.dataset-filters {
  padding: 0.5rem 1rem 1rem;
  margin-bottom: 2rem;
  h2,
  h3 {
    font-size: 1.125rem;
    font-weight: normal;
    line-height: 1.2;
  }
  h2 {
    border-bottom: 1px solid $lineColor1;
    margin-bottom: 0.5rem;
    padding-bottom: 0.5rem;
  }
  h3 {
    font-size: 0.875rem;
    text-transform: uppercase;
  }
  :deep(.el-checkbox-group) {
    display: flex;
    flex-direction: column;
  }
  :deep(.el-checkbox__label) {
    color: $purple;
  }
}
</style>
