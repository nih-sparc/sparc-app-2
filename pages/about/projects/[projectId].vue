<template>
  <Head>
    <Title>{{ title }}</Title>
    <Meta name="og:title" hid="og:title" :content="title" />
    <Meta name="twitter:title" :content="title" />
    <Meta name="description" hid="description" :content="description" />
    <Meta name="og:description" hid="og:description" :content="description" />
    <Meta name="twitter:description" :content="description" />
  </Head>
  <div :style="consortiaStyle" class="page pb-32">
    <breadcrumb :breadcrumb="breadcrumb" :title="title" />
    <div class="container">
      <div class="subpage projects-subpage projects-details-container">
        <div ref="projectDetailsContainer">
          <div class="row">
            <div class="col image-container p-16 mb-8">
              <img class="image" :src="getImageSrc" :alt="getImageAlt" />
            </div>
            <h1 class="col heading2 pl-16">
              {{ title }}
            </h1>
          </div>
          <div v-if="focus" class="body1">
            FOCUS: <span class="label4">{{ focus }}</span>
          </div>
          <div v-if="investigators" class="body1 mb-4">
            PRINCIPAL INVESTIGATOR(S): <span class="label4">{{ investigators.join(', ') }}</span>
          </div>
          <div v-if="institutions" class="body1 mb-4">
            INSTITUTION(S): <span class="label4">{{ institutions }}</span>
          </div>
          <div v-if="fundingProgram.length > 0" class="body1 mb-4">
            FUNDING PROGRAM(S): <span class="label4">{{ fundingProgram.join(', ') }}</span>
          </div>
          <div v-if="awards.length > 0" class="body1">
            AWARD(S):
            <span v-for="(award, index) in awards" :key=award.title class="body1">
              <a class="link1" :href="award.url" :target="!opensInNewTab(award.url) ? '_self' : '_blank'">
              {{ award.title }}
              <svgo-icon-open v-if="!isInternalLink(award.url)" class="icon-open" /><span v-if="index < awards.length - 1">, </span>
            </a>
            </span>
          </div>
          <hr class="mt-16" />
          <div class="body1 content" v-html="parseMarkdown(description)" />
          <div class="body1">
            <div class="label4">
              SHARE
            </div>
            <share-links class="share-links" />
            <hr class="mt-16" />
            <nuxt-link class="label4" :to="allProjectsLink">
              View All Projects >
            </nuxt-link>
          </div>
        </div>
      </div>
      <div v-if="associatedDatasets.length > 0" class="subpage associated-subpage">
        <div class="heading2">
          Associated Content
          <el-tooltip
            v-if="associatedContentTooltip"
            placement="right-start"
            effect="customized"
          >
            <template #default>
              <svgo-icon-help class="help-icon"/>
            </template>
            <template #content>
              {{ associatedContentTooltip }}
            </template>
          </el-tooltip>
        </div>
        <el-table :data="associatedDatasets" :show-header="false" empty-text="No Results">
          <el-table-column prop="banner" label="Image" width="160">
            <template v-slot="scope">
              <div v-if="scope.row?.pennsieve">
                <nuxt-link
                  :to="{
                    name: 'datasets-datasetId',
                    params: { datasetId: scope.row.object_id },
                    query: {
                      type: getSearchResultsType(scope.row?.item)
                    }
                  }"
                  class="img-dataset"
                > 
                  <img
                    v-if="scope.row.pennsieve.banner"
                    :src="scope.row.pennsieve.banner.uri"
                    :alt="`Banner for ${scope.row?.item.name}`"
                    height="128"
                    width="128"
                  />
                  <sparc-pill v-if="scope.row?.item.published" v-show='scope.row.item.published.status == "embargo"'>
                    Embargoed
                  </sparc-pill>
                </nuxt-link>
              </div>
            </template>
          </el-table-column>
          <el-table-column
            min-width="400"
          >
            <template v-slot:default="scope">
              <div v-if="scope.row?.pennsieve">
                <nuxt-link
                  :to="{
                    name: 'datasets-datasetId',
                    params: {datasetId: scope.row.object_id },
                    query: {
                      type: getSearchResultsType(scope.row.item)
                    }
                  }"
                  v-html="scope.row._highlightResult.item.name.value"
                />
                <div
                  class="my-8"
                  v-if="scope.row._highlightResult.item.description"
                  v-html="scope.row._highlightResult.item.description.value"
                />
              </div>
            </template>
          </el-table-column>
        </el-table>
      </div>
      <div v-if="associatedPublications.length > 0" class="subpage associated-subpage">
        <div class="heading2">
          Associated Primary Publications
          <el-tooltip
            v-if="associatedPublicationsTooltip"
            placement="right-start"
            effect="customized"
          >
            <template #default>
              <svgo-icon-help class="help-icon"/>
            </template>
            <template #content>
              {{ associatedPublicationsTooltip }}
            </template>
          </el-tooltip>
        </div>
        <el-table :data="associatedPublications" :show-header="false" empty-text="No Results">
          <el-table-column
            min-width="400"
          >
            <template v-slot:default="scope">
              <apa-citation v-if="scope.row?.doi" @doi-invalid="onDoiInvalid" :doi="scope.row.doi" />
            </template>
          </el-table-column>
        </el-table>
      </div>
      <div v-if="associatedTools.length > 0" class="subpage associated-subpage">
        <div class="heading2 mb-16">
          {{ associatedToolsTitle }}
          <el-tooltip
            v-if="associatedToolsTooltip"
            placement="right-start"
            effect="customized"
          >
            <template #default>
              <svgo-icon-help class="help-icon"/>
            </template>
            <template #content>
              {{ associatedToolsTooltip }}
            </template>
          </el-tooltip>
        </div>
        <gallery
          class="resources-gallery mr-16 mb-16"
          galleryItemType="resources"
          :items="associatedTools"
        />
      </div>
      <div v-if="highlights.length > 0" class="subpage">
        <div class="heading2 mb-16">
          Highlights
          <el-tooltip
            v-if="highlightsTooltip"
            placement="right-start"
            effect="customized"
          >
            <template #default>
              <svgo-icon-help class="help-icon"/>
            </template>
            <template #content>
              {{ highlightsTooltip }}
            </template>
          </el-tooltip>
        </div>
        <template v-for="(item, index) in highlights" :key="index">
          <div>
            <learn-more-card :about-details-item="item" />
            <hr v-if="highlights.length > 1 && index != highlights.length - 1" />
          </div>
        </template>
      </div>
    </div>
  </div>
</template>

<script>
import DoiChecker from '@/mixins/doi-checker'
import ApaCitation from '@/components/DatasetCitations/ApaCitation'
import DatasetCard from '@/components/DatasetCard/DatasetCard.vue'
import LearnMoreCard from '@/components/LearnMoreCard/LearnMoreCard.vue';
import ShareLinks from '@/components/ShareLinks/ShareLinks.vue'
import marked from '@/mixins/marked/index'
import { isInternalLink, opensInNewTab } from '@/mixins/marked/index'
import { pathOr, propOr } from 'ramda'
import consortiaMixin from '@/mixins/consortia'
import Gallery from '@/components/Gallery/Gallery.vue'
import { ref } from 'vue'

export default {
  name: 'ProjectDetails',
  components: {
    ApaCitation,
    DatasetCard,
    Gallery,
    LearnMoreCard,
    ShareLinks
  },
  mixins: [consortiaMixin, marked, DoiChecker],
  async setup() {
    const config = useRuntimeConfig()
    const route = useRoute()
    const { $axios, $contentfulClient } = useNuxtApp()
    try {
      const project = await $contentfulClient.getEntry(route.params.projectId)
      const awards = pathOr(null, ['fields','awards'], project)

      let associatedDatasetsResults = await Promise.all(awards.map(async (award) => {
        try {
          const { data } = await $axios.get(`${config.public.portal_api}/project/${award.fields.title}`)
          return Array.isArray(data) && data.length > 0 ? data : []
        } catch (error) {
          console.error(`Failed to fetch associated datasets for awardId ${award.fields.title}`, error)
          return []
        }
      }))

      const associatedDatasets = ref(associatedDatasetsResults.flat())

      let associatedPublicationsResults = associatedDatasets.value.length <= 0 ? [] :
        await Promise.all(associatedDatasets.value.map(async (dataset) => {
          try {
            if (dataset == undefined) { return }
            const { data } = await $axios.get(`${config.public.discover_api_host}/datasets/${dataset['objectID']}`)
            return propOr([], 'externalPublications', data).filter(function (elem) {
              return elem.relationshipType == 'IsDescribedBy'
            })
          } catch (error) {
            console.error(`Failed to fetch publication data for dataset ${dataset['objectID']}`, error)
            return []
          }
        }))

      const flattenedPublications = associatedPublicationsResults.flat()

      // Deduplicate by DOI
      const seen = new Set()
      const uniquePublications = flattenedPublications.filter((pub) => {
        if (seen.has(pub.doi)) return false
        seen.add(pub.doi)
        return true
      })

      const associatedPublications = ref(uniquePublications)

      return {
        fields: project.fields,
        awards: awards.map(award => award.fields),
        associatedDatasets,
        associatedPublications,
        associatedDatasetsMaxHeight: ref(0),
      }
    } catch (e) {
      console.error(e)
    }
  },

  mounted() {
    this.fetchConsortiaStyle(this.fundingProgram)
    this.$router.replace({'consortiaType': undefined})
  },

  watch: {
    consortiaStyle: {
      handler: function(){
        this.associatedDatasetsMaxHeight = this.$refs.projectDetailsContainer.clientHeight - 19
      }
    },
  },

  computed: {
    breadcrumb() {
      return [
        {
          to: {
            name: 'index'
          },
          label: 'Home'
        },
        {
          to: {
            name: 'about'
          },
          label: 'About'
        },
        {
          to: {
            path: '/about/projects',
          },
          label: 'Projects'
        },
        {
          to: {
            name: 'about-projects',
            query: {
              consortiaType: this.fundingProgram
            }
          },
          label: `${this.fundingProgram}`
        }
      ]
    },
    /**
     * Get image Source
     * @returns {String}
     */
    getImageSrc: function () {
      return pathOr('', ['institution', 'fields', 'logo', 'fields', 'file', 'url'], this.fields)
    },
    getImageAlt: function () {
      return pathOr('', ['institution', 'fields', 'logo', 'fields', 'file', 'description'], this.fields)
    },
    title: function () {
      return this.fields.title
    },
    description: function () {
      return this.fields.description
    },
    fundingProgram: function () {
      return this.fields.program
    },
    associatedContentTooltip: function () {
      return this.fields.associatedContentTooltip
    },
    institutions: function () {
      let names = ''
      this.fields.institutions.forEach(institution => {
        names += institution.fields.name + ", "
      })
      return names.substring(0, names.length - 2)
    },
    investigators: function () {
      return this.fields.principalInvestigators
    },
    /**
     * Compute subtitle based on its project section
     * @returns {String}
     */
    focus: function () {
      return propOr([], 'focus', this.fields).join(", ")
    },
    associatedPublicationsTooltip: function() {
      return propOr(null, 'associatedPublicationsTooltip', this.fields)
    },
    associatedTools: function() {
      return propOr([], 'associatedTools', this.fields)
    },
    associatedToolsTitle: function() {
      return propOr('Associated Tools & Resources', 'associatedToolsTitle', this.fields)
    },
    associatedToolsTooltip: function() {
      return propOr(null, 'associatedToolsTooltip', this.fields)
    },
    highlights: function() {
      return propOr([], 'highlights', this.fields)
    },
    highlightsTooltip: function() {
      return propOr(null, 'highlightsTooltip', this.fields)
    },
    allProjectsLink() {
      return `/about/projects?consortiaType=${this.fundingProgram}`
    }
  },

  methods: {
    isInternalLink,
    opensInNewTab,
    getSearchResultsType(item) {
      return item !== undefined ? 
        (item.types[0].name === 'computational model' ? 'simulation'
          : item.types[0].name === 'device' ? 'device'
          : undefined) :
        undefined
    },
    getCitationsText(citation) {
      const doiLinkIndex = citation.lastIndexOf("https://doi.org/"); // Find the doi link to remove and make it a href
      if (doiLinkIndex === -1) { return citation }
      const doiLink = citation.slice(doiLinkIndex, citation.length)
      // Remove the last instance of the substring by slicing and concatenating the parts
      return `${citation.slice(0, doiLinkIndex)}<u><a href="${doiLink}" target="_blank">${doiLink}</a></u>`
    }
  }
}
</script>

<style lang="scss" scoped>
@import 'sparc-design-system-components-2/src/assets/_variables.scss';
.page {
  background-color: $background;
}
.row {
  display: flex;
}
.image-container {
  display: flex;
  aspect-ratio: 1;
  border: 1px solid $lineColor2;
  max-width: 10rem;
}
.image {
  height: auto;
  width: 100%;
  margin: auto;
}
hr {
  border-top: none;
  border-left: none;
  border-right: none;
}
.associated-datasets-container {
  overflow: auto;
  overflow-x: hidden;
}
.content {
  :deep(img) {
    display: block;
    margin: auto;
    height: auto;
    max-width: 100%;
  }
}
@media screen and (max-width: 760px) {
  .row {
    flex-direction: column;
  }
  .share-links {
    margin-bottom: 1rem;
  }
  .associated-datasets-container {
    margin-bottom: 1rem;
  }
}
.icon-open {
  width: 1.5rem;
  height: 1.5rem;
}
.help-icon {
  color: var(--button-and-link-color);
  height: 1.5rem;
  width: 1.5rem;
}
.projects-details-container {
  height: fit-content;
}
.projects-subpage {
  padding: 1rem 2rem !important;
}
.associated-subpage {
  height: fit-content;
  padding-left: 1rem !important;
  padding-right: 0rem !important;
  padding-top: 1rem !important;
  padding-bottom: 0 !important;
  > .el-table {
    max-height: 32rem;
    overflow-y: auto;
  }
}
.subpage {
  margin: 0;
  margin-top: 2rem;
}
:deep(.resources-gallery-strip>.card-line) {
  display: block !important;
}
:deep(.container) {
  a {
    color: var(--button-and-link-color) !important;
  }
  .btn-copy-permalink {
    color: var(--button-and-link-color) !important;
    path {
      fill: var(--button-and-link-color) !important;
    }
  }
  .el-button.secondary, .el-button {
    background-color: var(--button-and-link-secondary-color) !important;
    border-color: var(--button-and-link-color) !important;
    color: var(--button-and-link-color) !important;
  }
}
:deep(.el-table--enable-row-hover .el-table__body tr:hover>td.el-table__cell) {
  background-color: white !important;
}
:deep(.el-popper .el-popper__arrow::before) {
  background-color: var(--button-and-link-secondary-color) !important;
}
:deep(.consortia-tooltips.el-popper) {
  background: var(--button-and-link-secondary-color) !important;
  border-color: var(--button-and-link-color) !important;
  color: $grey !important;
  border-radius: 4px;
}
</style>
