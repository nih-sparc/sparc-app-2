<template>
  <div class="page-data">
    <breadcrumb :breadcrumb="breadcrumb" :title="consortiaType.label" />
    <div class="container">
      <div class="search-tabs__container">
        <div class="heading2 pl-8 mb-8">
          Browse projects
        </div>
        <ul class="search-tabs">
          <li v-for="search in consortiaTypes" :key="search.label">
            <nuxt-link class="search-tabs__button" :class="{ active: search.id == $route.query.consortiaType }" :to="{
                path: 'projects',
                query: {
                  ...$route.query,
                  consortiaType: search.id,
                }
              }">
              {{ search.label }}
            </nuxt-link>
          </li>
        </ul>
      </div>
      <div class="search-bar__container">
        <div class="body1 mb-8">
          Search within consortia
        </div>
        <search-controls-contentful class="search-bar" placeholder="Enter search criteria" :path="$route.path"
          showSearchText />
      </div>
    </div>
    <div class="container">
      <el-row :gutter="32" type="flex">
        <el-col :span="24">
          <el-row :gutter="32">
            <el-col class="facet-menu" :sm="24" :md="8" :lg="6">
              <projects-facet-menu :anatomicalFocusFacets="projectsAnatomicalFocusFacets"
                @projects-selections-changed="onFacetSelectionChange()" @hook:mounted="facetMenuMounted"
                ref="projectsFacetMenu" />
            </el-col>
            <el-col :sm="searchColSpan('sm')" :md="searchColSpan('md')" :lg="searchColSpan('lg')">
              <div class="search-heading">
                <p v-show="!isLoadingSearch && searchData.items.length">
                  {{ searchData.total }} Results | Showing
                  <pagination-menu :page-size="searchData.limit" @update-page-size="updateDataSearchLimit" />
                </p>
                <span class="label1">
                  Sort
                  <sort-menu :options="projectsSortOptions" :selected-option="selectedProjectsSortOption"
                    @update-selected-option="onProjectsSortOptionChange" />
                </span>
              </div>
              <div v-loading="isLoadingSearch" class="table-wrap">
                <p v-if="searchFailed" class="search-error">
                  Sorry, the search engine has encountered an unexpected
                  error, please try again later.
                </p>
                <project-search-results :tableData="tableData" />

                <div class="mt-24">
                  <alternative-search-results ref="altSearchResults" :data-types="consortiaTypes"
                    @vue:mounted="altResultsMounted" />
                  <br />
                </div>
              </div>
              <div class="search-heading">
                <p v-if="!isLoadingSearch && searchData.items.length">
                  {{ searchHeading }} | Showing
                  <pagination-menu :page-size="searchData.limit" @update-page-size="updateDataSearchLimit" />
                </p>
                <pagination v-if="searchData.limit < searchData.total" :selected="curSearchPage"
                  :page-size="searchData.limit" :total-count="searchData.total" @select-page="onPaginationPageChange" />
              </div>
            </el-col>
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
  head,
  pathOr,
  propOr
} from 'ramda'
import SearchControlsContentful from '@/components/SearchControlsContentful/SearchControlsContentful.vue'
import AlternativeSearchResults from '@/components/AlternativeSearchResults/AlternativeSearchResultsProjects.vue'
import ProjectsFacetMenu from '@/components/FacetMenu/ProjectsFacetMenu.vue'
import ProjectSearchResults from '@/components/SearchResults/ProjectSearchResults.vue'
import SortMenu from '@/components/SortMenu/SortMenu.vue'

const searchResultsComponents = {
  projects: ProjectSearchResults
}

const projectsSortOptions = [
  {
    label: 'A-Z',
    id: 'alphabetical',
    sortOrder: 'fields.title'
  },
  {
    label: 'Z-A',
    id: 'reverseAlphabetical',
    sortOrder: '-fields.title'
  },
]

export default {
  name: 'ProjectsPage',

  components: {
    SearchControlsContentful,
    AlternativeSearchResults,
    SortMenu,
    ProjectsFacetMenu,
    ProjectSearchResults
  },

  async setup() {
    const route = useRoute()
    const { $contentfulClient } = useNuxtApp()

    let projectsAnatomicalFocusFacets = []
    let consortiaTypes = []
    await $contentfulClient.getEntries({
      content_type: 'awardSection',
    })
      .then(async response => {
        let facetData = []
        const items = propOr([], 'items', response)
        items.forEach(item => {
          const label = pathOr('', ['fields', 'title'], item)
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
          consortiaTypes = facetData
        }
      })
    })
    const consortiaType = consortiaTypes.find(consortiaType => {
      return consortiaType.id == route.query.consortiaType
    })
    const title = propOr('', 'label', consortiaType)
    useHead({
      title: title,
      meta: [
        {
          hid: 'og:title',
          property: 'og:title',
          content: title,
        },
        {
          hid: 'description',
          name: 'description',
          content: `Browse ${title}`
        },
      ]
    })
    return {
      projectsSortOptions,
      selectedProjectsSortOption: ref(projectsSortOptions.find(opt => opt.id === route.query.projectsSort) || projectsSortOptions[0]),
      projectsAnatomicalFocusFacets,
      consortiaTypes
    }
  },

  data: () => {
    return {
      searchQuery: '',
      searchData: {
        limit: 10,
        skip: 0,
        items: [],
        total: 0
      },
      facets: [],
      isLoadingSearch: false,
      searchFailed: false,
      breadcrumb: [
        {
          to: {
            name: 'index'
          },
          label: 'Home'
        },
        {
          to: {
            name: 'about',
          },
          label: 'About'
        },
        {
          to: {
            path: 'projects'
          },
          label: 'Projects'
        },
      ],
      titleColumnWidth: 300,
      windowWidth: ''
    }
  },

  computed: {
    consortiaType: function () {
      const consortiaTypeQuery = pathOr('', ['query', 'consortiaType'], this.$route)
      const consortiaType = this.consortiaTypes.find(consortiaType => {
        return consortiaType.id == consortiaTypeQuery
      })

      return defaultTo(head(this.consortiaTypes), consortiaType)
    },

    tableData: function () {
      return propOr([], 'items', this.searchData)
    },

    searchResultsComponent: function () {
      return defaultTo('', searchResultsComponents[this.$route.query.consortiaType])
    },

    curSearchPage: function () {
      return this.searchData.skip / this.searchData.limit + 1
    },

    searchHeading: function () {
      const query = pathOr('', ['query', 'search'], this.$route)

      const consortiaType = this.consortiaTypes.find(consortiaType => {
        return consortiaType.id == this.$route.query.consortiaType
      })
      const consortiaTypeLabel = propOr('', 'label', consortiaType)

      let searchHeading = `${this.searchData.total} ${consortiaTypeLabel}`

      return query === '' ? searchHeading : `${searchHeading} for “${query}”`
    },

    search: function () {
      return this.$route.query.search || ''
    },

    isMobile: function () {
      return this.windowWidth <= 500
    }
  },

  watch: {
    '$route.query.consortiaType': {
      handler: function () {
        if (!this.$route.query.consortiaType) {
          this.$router.push({
            query: { consortiaType: this.consortiaType['id'] }
          })
        } else {
          this.searchData = {
            limit: 10,
            skip: 0,
            items: [],
            total: 0
          }
          this.fetchResults()
        } 
      }
    },
    '$route.query.search': {
      handler: function () {
        this.searchQuery = this.$route.query.search
        this.fetchResults()
      },
      immediate: true
    },
    '$route.query.projectsSort': {
      handler: function (option) {
        this.fetchResults()
      },
      immediate: true
    },
    '$route.query.selectedProjectsAnatomicalFocusIds': {
      handler: function (option) {
        this.fetchResults()
      },
      immediate: true
    },
  },

  beforeMount: function () {
    this.windowWidth = window.innerWidth
  },
  mounted: function () {
    if (!this.$route.query.consortiaType) {
      const firstTabType = compose(propOr('', 'label'), head)(this.consortiaTypes)
      this.$router.replace({ query: { consortiaType: firstTabType } })
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
  },

  methods: {
    updateDataSearchLimit: function (limit) {
      this.searchData.skip = 0

      const newLimit = limit === 'View All' ? this.searchData.total : limit

      this.searchData.limit = newLimit
      this.$router.replace({
        query: { ...this.$route.query, limit: newLimit, skip: 0 }
      })
      this.fetchResults()
    },

    facetMenuMounted: function () {
      this.fetchResults()
    },

    fetchResults: function () {
      this.isLoadingSearch = true
      var contentType = 'sparcAward'
      var consortiaType = this.$route.query.consortiaType
      const anatomicalFocus = this.$refs.projectsFacetMenu?.getSelectedAnatomicalFocusTypes()
      var sortOrder = this.selectedProjectsSortOption.sortOrder
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
            'fields.focus[in]': anatomicalFocus,
            'fields.program[in]': consortiaType
          })
          .then(async response => {
            this.searchData = { ...response }
          })
          .catch(() => {
            this.searchData = clone(searchData)
          })
          .finally(() => {
            this.isLoadingSearch = false
          })
      }
      this.$refs.altSearchResults?.retrieveAltTotals()
    },

    onFacetSelectionChange: function () {
      this.searchData.skip = 0
      this.fetchResults()
    },

    onPaginationPageChange: function (page) {
      const offset = (page - 1) * this.searchData.limit
      this.searchData.skip = offset

      this.$router.replace({
        query: { ...this.$route.query, skip: offset }
      })

      this.fetchResults()
    },

    onResize: function (width) {
      width <= 768
        ? (this.titleColumnWidth = 150)
        : (this.titleColumnWidth = 300)
      this.windowWidth = width
    },

    searchColSpan(viewport) {
      const viewports = {
        sm: 24,
        md: 16,
        lg: 18
      }

      return viewports[viewport] || 24
    },
    async onProjectsSortOptionChange(option) {
      this.selectedProjectsSortOption = option
      this.searchData.skip = 0
      this.$router.replace({
        query: {
          ...this.$route.query,
          skip: 0,
          projectsSort: option.id
        }
      })
    },
    altResultsMounted() {
      this.$refs.altSearchResults?.retrieveAltTotals()
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

  li:last-child>a {
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
    margin: 0 0 auto;
    text-align: center;
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
