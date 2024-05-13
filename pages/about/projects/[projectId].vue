<template>
  <div :style="consortiaStyle" class="page pb-32">
    <breadcrumb :breadcrumb="breadcrumb" :title="title" />
    <div class="container">
      <div class="subpage mb-32">
        <el-row :gutter="32">
          <el-col :span="8" :xs="24">
            <div class="image-container p-16 mx-32 mb-32">
              <img class="image" :src="getImageSrc" :alt="getImageAlt" />
            </div>
            <hr />
            <div class="body1">
              <template v-if="focus">
                <div class="label4">
                  FOCUS
                </div>
                <div class="mb-16">
                  {{ focus }}
                </div>
              </template>
              <template v-if="investigator">
                <div class="label4">
                  PRINCIPAL INVESTIGATOR
                </div>
                <div class="mb-16">
                  {{ investigator }}
                </div>
              </template>
              <template v-if="institution">
                <div class="label4">
                  INSTITUTION
                </div>
                <div class="mb-16">
                  {{ institution }}
                </div>
              </template>
              <template v-if="fundingProgram.length > 0">
                <div class="label4">
                  FUNDING PROGRAM
                </div>
                <div class="mb-16">
                  {{ fundingProgram[0] }}
                </div>
              </template>
              <template v-if="awardId">
                <div class="label4">
                  AWARD
                </div>
                <div class="mb-16">
                  <a :href="nihReporterUrl" :target="!opensInNewTab(nihReporterUrl) ? '_self' : '_blank'">
                    {{ awardId }}
                    <svgo-icon-open v-if="!isInternalLink(nihReporterUrl)" class="icon-open" />
                  </a>
                </div>
              </template>
              <div class="label4">
                SHARE
              </div>
              <share-links class="share-links" />
            </div>
            <template v-if="showAssociatedDatasets">
              <hr class="mt-16" />
              <div class="label4">
                ASSOCIATED DATASETS
              </div>
              <br />
              <div class="associated-datasets-container">
                <div v-for="(dataset, index) in associatedDatasets" :key="index" class="body4 ">
                  <dataset-card :id="dataset.id" />
                </div>
              </div>
            </template>
          </el-col>
          <el-col :span="16" :xs="24">
            <h1 class="heading2 mb-32">
              {{ title }}
            </h1>
            <div class="body1 content" v-html="parseMarkdown(description)" />
          </el-col>
        </el-row>
      </div>
      <nuxt-link class="back-link" :to="allProjectsLink">
        View All Projects >
      </nuxt-link>
    </div>
  </div>
</template>

<script>
import DatasetCard from '@/components/DatasetCard/DatasetCard.vue'
import ShareLinks from '@/components/ShareLinks/ShareLinks.vue'
import marked from '@/mixins/marked/index'
import { isInternalLink, opensInNewTab } from '@/mixins/marked/index'
import { propOr, isEmpty } from 'ramda'
import consortiaMixin from '@/mixins/consortia'

export default {
  name: 'ProjectDetails',
  components: {
    DatasetCard,
    ShareLinks
  },
  mixins: [consortiaMixin, marked],
  async setup() {
    const config = useRuntimeConfig()
    const route = useRoute()
    const { $axios, $contentfulClient } = useNuxtApp()
    try {
      const project = await $contentfulClient.getEntry(route.params.projectId)
      let associatedDatasets = {}
      await $axios.get(`${config.public.portal_api}/project/${project.fields.awardId}`).then(({ data }) => {
        associatedDatasets = data
      }).catch(() => {
        // No award ID found
      })
      useHead({
        title: project.fields.title,
        meta: [
          {
            hid: 'og:title',
            property: 'og:title',
            content: project.fields.title,
          },
          {
            hid: 'description',
            name: 'description',
            content: project.fields.description ? project.fields.description : 'The open community platform for bridging the body and the brain through neuroscience and systems physiology data, computational and spatial modeling, and device design.'
          },
        ]
      })
      return {
        fields: project.fields,
        associatedDatasets: propOr([], 'datasets', associatedDatasets)
      }
    } catch (e) {
      console.error(e)
    }
  },

  mounted() {
    this.fetchConsortiaStyle(this.fundingProgram)
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
            name: 'about-projects',
            query: {
              consortiaType: this.fundingProgram
            }
          },
          label: 'Projects'
        }
      ]
    },
    /**
     * Get image Source
     * @returns {String}
     */
    getImageSrc: function() {
      return this.fields.institution.fields.logo
        ? this.fields.institution.fields.logo.fields.file.url
        : ''
    },
    title: function() {
      return this.fields.title
    },
    description: function() {
      return this.fields.description
    },
    fundingProgram: function() {
      return this.fields.program
    },
    awardId: function() {
      return this.fields.awardId
    },
    institution: function() {
      return this.fields.institution.fields.name
    },
    investigator: function() {
      return this.fields.principleInvestigator
    },
    nihReporterUrl: function() {
      return this.fields.nihReporterUrl || '#'
    },
    /**
     * Get image source
     * @returns {String}
     */
    getImageAlt: function() {
      return this.fields.institution.fields.logo
        ? this.fields?.institution.fields.logo.fields.file.description
        : ''
    },
    /**
     * Compute subtitle based on its project section
     * @returns {String}
     */
    focus: function() {
      return propOr([], 'focus', this.fields).join(", ")
    },
    showAssociatedDatasets: function() {
      return !isEmpty(this.associatedDatasets)
    },
    allProjectsLink() {
      return `/about/projects?consortiaType=${this.fundingProgram}`
    }
  },

  methods: {
    isInternalLink,
    opensInNewTab
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
.back-link {
  color: white;
  font-weight: 500;
}
.first-column {
  max-width: 25rem;
}
.image-container {
  display: flex;
  aspect-ratio: 1;
  border: 1px solid $lineColor2;
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
  max-height: 20rem;
  overflow: auto;
  overflow-x: hidden;
  text-overflow: hidden;
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
</style>
