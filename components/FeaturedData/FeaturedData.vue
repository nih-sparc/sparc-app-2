<template>
  <div class="featured-data container py-32">
    <h2 class="heading2 mt-0">Find Data by Category</h2>
    <div class="data-wrap">
      <nuxt-link
        v-for="(item, index) in featuredData"
        :key="item.sys.id"
        class="featured-data__item"
        :to="`${getLink(item.fields)}`"
        v-show="isVisible(index)"
      >
        <img
          :src="imageUrl(item)"
          :alt="`Icon for ${item.fields.label} category`"
        />
        <p class="mb-0 mt-8">
          {{ item.fields.label }}
        </p>
      </nuxt-link>
    </div>
    <el-button @click="viewMoreClicked" class="mt-32 secondary">
      {{ viewMoreText }}
    </el-button>
  </div>
</template>
<script>
import { getAlgoliaFacets, facetPropPathMapping } from '../../utils/algolia'

import { isEmpty, pathOr } from 'ramda'
const MINIMUM_TO_SHOW = 6

export default {
  name: 'FeaturedData',

  props: {
    featuredData: {
      type: Array,
      default: () => []
    }
  },

  data: () => {
    return {
      organFacets: [],
      viewMore: false
    }
  },

  created() {
    this.loadOrganFacets()
  },

  computed: {
    viewMoreText() {
      return this.viewMore ? 'View Less' : 'View More'
    }
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
    loadOrganFacets: function() {
      const algoliaIndex = this.$algoliaClient.initIndex(this.$config.public.ALGOLIA_INDEX)
      getAlgoliaFacets(algoliaIndex, facetPropPathMapping)
        .then(data => {
          this.organFacets = data.find(
            facet => facet.key === 'anatomy.organ.name'
          ).children
        })
    },
    filterOrgans(contentfulFields) {
      const normStr = str => str.toLowerCase().trim()
      let organs = this.organFacets.filter(
        organ =>
          normStr(organ.label).includes(normStr(contentfulFields.label)) || 
          (contentfulFields.containsSearch && contentfulFields.containsSearch.some(keyword => normStr(organ.label).includes(normStr(keyword))))
      )
      this.organFacets.forEach(organFacet => {
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
    getLink(contentfulFields) {
      if (isEmpty(this.organFacets)) {
        return contentfulFields.link
      }
      var organIds = this.filterOrgans(contentfulFields).map(organ => organ.id)
      return organIds.length === 0
        ? contentfulFields.link
        : `${contentfulFields.link}&selectedFacetIds=${organIds.join(',')}`
    },
    viewMoreClicked() {
      this.viewMore = !this.viewMore
    },
    isVisible(index) {
      return this.viewMore ? true : index < MINIMUM_TO_SHOW
    }
  }
}
</script>
<style lang="scss" scoped>
.featured-data {
  text-align: center;
}
.data-wrap {
  align-items: center;
  display: grid;
  justify-items: center;
  justify-content: space-evenly;

  @media (min-width: 768px) {
    padding-left: 0.4375rem;
    padding-right: 0.4375rem;
  }
  @media (min-width: 1024px) {
    grid-template-columns: 1fr 1fr 1fr 1fr 1fr 1fr;
  }
  @media (max-width: 1023px) {
    grid-template-columns: 1fr 1fr 1fr;
  }
  @media (max-width: 767px) {
    grid-template-columns: 1fr 1fr;
  }
}
.featured-data__item {
  color: #000;
  text-decoration: none;
  width: 128px;
  margin: 0.525em 0rem;
  &:hover,
  &:focus {
    opacity: 0.9;
  }
  img {
    background: #fff;
    border-radius: 50%;
    display: block;
    margin-bottom: 8px;
    width: 128px;
    border: solid 1px #c0c4cc;
    height: 128px;
  }
  p {
    font-size: 1em;
    font-weight: 700;
    color: #24245b;
    &:hover {
      text-decoration: underline;
    }
  }
}
</style>
