<template>
  <div :style="consortiaStyle" class="page pb-32">
    <breadcrumb :breadcrumb="breadcrumb" :title="title" />
    <div class="container">
      <el-row class="row space-between">
        <el-col class="subpage projects-subpage projects-details-container" :span="showAssociatedDatasets ? 17 : 24"
          :xs="24">
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
            <div v-if="awardId" class="body1">
              NIH AWARD:
              <a class="link1" :href="nihReporterUrl" :target="!opensInNewTab(nihReporterUrl) ? '_self' : '_blank'">
                {{ awardId }}
                <svgo-icon-open v-if="!isInternalLink(nihReporterUrl)" class="icon-open" />
              </a>
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
        </el-col>
        <el-col v-if="showAssociatedDatasets" class="subpage associated-subpage" :span="6" :xs="24">
          <div class="heading2">
            Associated Content
          </div>
          <div class="associated-datasets-container pr-16" :style="{ maxHeight: associatedDatasetsMaxHeight + 'px' }">
            <br />
            <div v-for="(dataset, index) in associatedDatasets" :key="index" class="body4 ">
              <dataset-card :id="dataset.id" />
            </div>
          </div>
        </el-col>
      </el-row>
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
import { ref } from 'vue'

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
        associatedDatasets: propOr([], 'datasets', associatedDatasets),
        associatedDatasetsMaxHeight: ref(0)
      }
    } catch (e) {
      console.error(e)
    }
  },

  mounted() {
    this.fetchConsortiaStyle(this.fundingProgram)
  },

  watch: {
    consortiaStyle: {
      handler: function(){
        this.associatedDatasetsMaxHeight = this.$refs.projectDetailsContainer.clientHeight - 19
      }
    }
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
          label: `${this.fundingProgram}`
        }
      ]
    },
    /**
     * Get image Source
     * @returns {String}
     */
    getImageSrc: function () {
      return this.fields.institutions[0].fields.logo
        ? this.fields.institutions[0].fields.logo.fields.file.url
        : ''
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
    awardId: function () {
      return this.fields.awardId
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
    nihReporterUrl: function () {
      return this.fields.nihReporterUrl || '#'
    },
    /**
     * Get image source
     * @returns {String}
     */
    getImageAlt: function () {
      return this.fields.institutions[0].fields.logo
        ? this.fields?.institutions[0].fields.logo.fields.file.description
        : ''
    },
    /**
     * Compute subtitle based on its project section
     * @returns {String}
     */
    focus: function () {
      return propOr([], 'focus', this.fields).join(", ")
    },
    showAssociatedDatasets: function () {
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
.space-between {
  justify-content: space-between;
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
}
</style>
