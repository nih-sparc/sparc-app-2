<template>
  <div class="dataset-action-box mt-16 p-8">
    <div class="banner-container mb-4" v-if="isCollection">
      <div v-if="datasetInfo?.doiCollection?.banners?.length > 0" class="img-grid">
        <div class="grid"  
          :style="{
            gridTemplateColumns: `repeat(${getGridCols(datasetInfo?.doiCollection?.size)}, 1fr)`,
            gridTemplateRows: `repeat(${getGridRows(datasetInfo?.doiCollection?.size)}, 1fr)`
          }"
        >
          <client-only>
            <img
              v-for="(img, index) in datasetInfo?.doiCollection?.banners"
              :key="index"
              :src="img"
              :alt="`Banner ${index + 1}`"
            />
          </client-only>
        </div>
      </div>
    </div>
    <dataset-banner-image v-else :src="datasetImage" />
    <div class="pill-container" v-if="embargoed">
      <sparc-pill v-if="embargoed" class="mb-4">
        Embargoed
      </sparc-pill>
    </div>
    <div class="button-container">
      <template v-if="canViewScaffold">
        <template v-if="hasFiles">
          <el-button
            class="dataset-button"
            @click="actionButtonClicked('images')"
          >
            View Scaffold
          </el-button>
          <el-button
            class="dataset-button"
            @click="actionButtonClicked('files')"
          >
            Get Scaffold
          </el-button>
        </template>
        <el-button v-if="datasetTypeName === 'scaffold'" class="secondary" @click="actionButtonClicked('cite')">
          Cite Scaffold
        </el-button>
      </template>
      <template v-else-if="datasetTypeName === 'device'">
        <template v-if="hasFiles">
          <el-button
            class="dataset-button"
            @click="actionButtonClicked('files')"
          >
            Get Device
          </el-button>
        </template>
        <el-button class="secondary" @click="actionButtonClicked('cite')">
          Cite Device
        </el-button>
      </template>
      <template v-else-if="datasetTypeName === 'computational model'">
        <el-button v-if="canViewSimulation" @click="actionButtonClicked('images')">
          View Simulation
        </el-button>
        <a
          v-if="canRunSimulation"
          :href="`https://osparc.io/study/${simulationId}`"
          target="_blank"
        >
          <el-button>
            Run Simulation
          </el-button>
        </a>
        <el-button
          v-if="hasFiles"
          @click="actionButtonClicked('files')"
        >
          Get Model
        </el-button>
        <el-button class="secondary" @click="actionButtonClicked('cite')">
          Cite Model
        </el-button>
      </template>
      <template v-else-if="isCollection">
        <el-button
          v-if="hasContent"
          @click="actionButtonClicked('contents')"
        >
          View Contents
        </el-button>
      </template>
      <template v-else>
        <el-button
          v-if="hasFiles"
          @click="actionButtonClicked('files')"
        >
          Get Dataset
        </el-button>
        <el-button class="secondary" @click="actionButtonClicked('cite')">
          Cite Dataset
        </el-button>
      </template>
      <template v-if="hasSourceCode">
        <el-button class="secondary" @click="actionButtonClicked('source')">
          Open Source Code
        </el-button>
      </template>
      <template v-if="sdsViewer && !isCollection">
        <a
          :href="sdsViewer"
          target="_blank"
        >
          <el-button class="secondary" @click="onSdsButtonClick">
            Explore In SDS Viewer
          </el-button>
        </a>
      </template>
    </div>
  </div>
</template>

<script>
import { mapState } from 'pinia'
import { useMainStore } from '../../store/index.js'
import { pathOr, propOr } from 'ramda'
import DatasetBannerImage from '@/components/DatasetBannerImage/DatasetBannerImage.vue'
import SparcPill from '@/components/SparcPill/SparcPill.vue'

export default {
  name: 'DatasetActionBox',

  components: {
    DatasetBannerImage,
    SparcPill
  },

  computed: {
    ...mapState(useMainStore, ['datasetInfo', 'datasetTypeName', 'userToken']),
    /**
     * Gets dataset version
     * @returns {Number}
     */
    version: function() {
      return propOr(1, 'version', this.datasetInfo)
    },
    /**
     * Returns dataset banner
     * @returns {String}
     */
    datasetImage: function() {
      return propOr('', 'banner', this.datasetInfo)
    },
    isCollection: function () {
      return propOr('', 'datasetType', this.datasetInfo) == 'collection'
    },
    banners: function () {
      return pathOr([], ['doiCollection','banners'], this.datasetInfo)
    },
    gridCols() {
      const count = this.banners?.length || 1
      if (count === 1) return 1
      return Math.ceil(Math.sqrt(count)) // closest square layout
    },
    gridRows() {
      const count = this.banners?.length || 1
      return Math.ceil(count / this.gridCols)
    },
    gridStyle() {
      return {
        display: 'grid',
        gap: '2px',
        width: '160px',
        height: '160px',
        gridTemplateColumns: `repeat(${this.gridCols}, 1fr)`,
        gridTemplateRows: `repeat(${this.gridRows}, 1fr)`
      }
    },
    /**
     * Returns whether a scaffold can be viewed
     */
    canViewScaffold: function() {
      return this.datasetInfo.sciCrunch ? this.datasetInfo.sciCrunch['abi-scaffold-metadata-file'] : false
    },
    /**
     * Returns whether a simulation can be viewed
     */
    canViewSimulation: function() {
      return this.datasetInfo.sciCrunch ? this.datasetInfo.sciCrunch['abi-simulation-file'] : false
    },
    /**
     * Returns simulation id for run simulation button
     * @returns {String}
     */
    simulationId: function() {
      return this.canRunSimulation ? this.datasetInfo.study.uuid : ''
    },
    canRunSimulation: function() {
      return this.datasetInfo.study
    },
    hasFiles: function() {
      return this.fileCount >= 1
    },
    hasContent: function () {
      return pathOr(0, ['doiCollection','size'], this.datasetInfo) > 0
    },
    hasSourceCode: function () {
      return propOr(null, 'release', this.datasetInfo) !== null
    },
    fileCount: function() {
      return propOr('0', 'fileCount', this.datasetInfo)
    },
    embargoed: function() {
      return propOr(false, 'embargo', this.datasetInfo)
    },
    sdsViewer: function() {
      if (this.datasetInfo.doi) {
        const metacellUrl = new URL(this.$config.public.METACELL_SDS_VIEWER_URL)
        metacellUrl.searchParams.append('doi', this.datasetInfo.doi)
        return metacellUrl.toString()
      }
      return null
    }
  },

  methods: {
    getGridCols(count) {
      if (count === 1) return 1
      if (count <= 4) return 2
      return 3
    },
    getGridRows(count) {
      if (count === 1) return 1
      if (count <= 4) return 2
      return Math.ceil(count / 3)
    },
    /**
     * Get the dataset details tab area by id
     * @returns {Object}
     */
    getDatasetDetailsTabArea: function() {
      return document.getElementById('datasetDetailsTabsContainer')
    },
    onSdsButtonClick(){
      this.$gtm.trackEvent({
        event: 'interaction_event',
        event_name: 'sds_viewer_button_click',
        location: 'dataset_action_box',
        category: "",
        dataset_id: propOr('', 'id', this.datasetInfo),
        version_id: propOr('', 'version', this.datasetInfo),
        doi: propOr('', 'doi', this.datasetInfo),
        citation_type: "",
        files: "",
        file_name: "",
        file_path: "",
        file_type: "",
      })
    },
    /**
     * scroll to the dataset details tab area
     */
    scrollToDatasetDetailsTabArea: function() {
      this.getDatasetDetailsTabArea().scrollIntoView()
    },
    actionButtonClicked: function(tabId) {
      this.$router.replace({
        query: { ...this.$route.query, datasetDetailsTab: tabId }
      }).finally(() => {
        this.scrollToDatasetDetailsTabArea()
      })
    },
    openSimulationViewer: function() {
      const link = document.createElement('a')

      link.href = `${this.$router.options.base || '/'}datasets/simulationviewer?id=${this.datasetInfo.id}`
      link.target = '_blank'

      document.body.appendChild(link)

      link.click()
      link.remove()
    },
  }
}
</script>

<style lang="scss" scoped>
@import 'sparc-design-system-components-2/src/assets/_variables.scss';

.dataset-action-box {
  display: flex;
  flex-direction: column;
  border: solid 1px $lineColor1;
  text-align: center;
  background: white;
  position: relative;
  button {
    margin: .25rem 0;
  }
  a {
    display: inline-grid;
    text-decoration: none;
  }
  .button-container {
    display: flex;
    flex-direction: column;
    width: fit-content;
    align-self: center;
  }
  .ospac-tooltip {
    color: $purple;
  }
}
.pill-container {
  position: absolute;
  right: 1rem;
  top: 1rem;
}

.img-grid {
  display: block;
  width: 100%;
  height: auto;

  .grid {
    display: grid;
    gap: 2px;
    width: 100%;
    height: 100%;
  }

  img {
    width: 100%;
    height: 100%;
    object-fit: cover;
    border-radius: 2px;
  }
}

.pill-container {
  margin-top: 8px;
}
</style>
