<template>
  <div class="featured-data container py-32">
    <div class="categories-container mb-8">
      <span class="heading2 mt-0 mr-12">Find by</span>
      <el-select class="categories-select" v-model="selectedCategory">
        <el-option v-for="category in categories" :key="category" :label="category" :value="category" />
      </el-select>
    </div>
    <gallery galleryItemType="featuredData" :card-width=Number(12) :items="selectedCategoryFeaturedData" :key="refreshKey" />
  </div>
</template>
<script>
import Gallery from '@/components/Gallery/Gallery.vue'
import { getAlgoliaFacets, facetPropPathMapping } from '../../utils/algolia'
import { ref } from 'vue'
import { isEmpty, pathOr } from 'ramda'

export default {
  name: 'FeaturedData',
  components: {
    Gallery
  },
  props: {
    featuredData: {
      type: Array,
      default: () => []
    }
  },
  async setup() {
    const { $contentfulClient } = useNuxtApp()
    let categories = []
    await $contentfulClient.getContentType('featuredData').then(contentType => {
      contentType.fields.forEach((field) => {
        if (field.id === 'facetType') {
          categories = field.items?.validations[0]['in']
        }
      })
    })
    const selectedCategory = ref(categories[0])

    return {
      categories,
      selectedCategory,
    }
  },

  data: () => {
    return {
      facets: [],
      viewMore: false,
      refreshKey: 0
    }
  },

  computed: {
    viewMoreText() {
      return this.viewMore ? 'View Less' : 'View More'
    },
    selectedCategoryFeaturedData() {
      return this.featuredData.filter(data => data.fields.facetType == this.selectedCategory)
    }
  },

  watch: {
    selectedCategory: {
      handler: async function () {
        const categoryKey = facetPropPathMapping.find(item => item.label == this.selectedCategory).facetPropPath
        // Load facets so that we can determine the link for the featured data
        const algoliaIndex = this.$algoliaClient.initIndex(this.$config.public.ALGOLIA_INDEX)
        const facets = await getAlgoliaFacets(algoliaIndex, facetPropPathMapping)
          .then(data => {
            return data.find(
              facet => facet.key == categoryKey
            ).children
          })
        this.featuredData.forEach(({ fields }) => {
          fields['linkWithFacets'] = this.getLink(fields, facets)
        })
        this.refreshKey += 1
      },
      immediate: true
    },
  },

  methods: {
    /**
     * Get image URL for the featured data
     * @param {Object} item
     * @returns {String}
     */
    imageUrl: function(item) {
      return pathOr('', ['fields', 'image', 'fields', 'file', 'url'], item)
    },
    filterOrgans(contentfulFields, organFacets) {
      const normStr = str => str.toLowerCase().trim()
      let organs = organFacets.filter(
        organ =>
          normStr(organ.label).includes(normStr(contentfulFields.label)) ||
          (contentfulFields.containsSearch && contentfulFields.containsSearch.some(keyword => normStr(organ.label).includes(normStr(keyword))))
      )
      organFacets.forEach(organFacet => {
        if (organFacet.children.length == 0) {
          return
        }
        const subOrgans = organFacet.children.filter(
          subOrgan =>
            normStr(subOrgan.label).includes(normStr(contentfulFields.label)) ||
            (contentfulFields.containsSearch && contentfulFields.containsSearch.some(keyword => normStr(subOrgan.label).includes(normStr(keyword))))
        )
        organs = organs.concat(subOrgans)
      })
      return organs
    },
    getLink(contentfulFields, organFacets) {
      if (isEmpty(organFacets)) {
        return contentfulFields.link
      }
      var organIds = this.filterOrgans(contentfulFields, organFacets).map(organ => organ.id)
      return organIds.length === 0
        ? contentfulFields.link
        : `${contentfulFields.link}&selectedFacetIds=${organIds.join(',')}`
    }
  }
}
</script>

<style lang="scss" scoped>
.featured-data {
  text-align: center;
}
.categories-container {
  display: flex;
  text-align: left;
}
.categories-select {
  width: 12rem;;
}
</style>
