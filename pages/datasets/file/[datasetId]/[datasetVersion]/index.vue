<template>
  <client-only>
    <div class="pb-32 page-data">
      <breadcrumb :breadcrumb="breadcrumb" :title="fileName" />
      <div class="container">
        <h1 hidden>File viewer for {{ file.path }}</h1>
        <form ref="zipForm" method="POST" :action="zipitUrl">
          <input v-model="zipData" type="hidden" name="data" />
        </form>
        <span class="help-link" v-if="hasViewer && (activeHelperId in helpers)">
          <a :href="`https://docs.sparc.science/docs/${helpers[activeHelperId].link}`" target="_blank">
            Find out more about the {{ helpers[activeHelperId].name }}
          </a>
        </span>
        <content-tab-card v-if="hasViewer" class="mt-24" :tabs="tabs" :active-tab-id="activeTabId"
          @tab-changed="activeTabId = $event.id">
          <template v-if="hasOrthogonalViewer">
            <template v-for="(asset, idx) in viewerAssets" :key="asset.asset_url">
              <orthogonal-viewer
                v-if="activeTabId === `orthogonalViewer-${idx}`"
                :asset="asset"
                :datasetInfo="datasetInfo"
                :file="file"
                @download-file="executeDownload" />
            </template>
          </template>
          <simulation-viewer v-if="hasSimulationViewer && activeTabId === 'simulationViewer'"
            :apiLocation="apiLocation" :datasetInfo="datasetInfo" :file="file" @download-file="executeDownload" />
          <plot-viewer v-if="hasPlotViewer && activeTabId === 'plotViewer'" :plotInfo="plotInfo"
            :datasetInfo="datasetInfo" :file="file" @download-file="executeDownload" />
          <video-viewer v-if="hasVideoViewer && activeTabId === 'videoViewer'" :videoData="videoData"
            :videoSource="signedUrl" :datasetInfo="datasetInfo" :file="file" @download-file="executeDownload" />
          <KeepAlive>
            <ome-viewer-component v-if="hasOmeViewer && activeTabId === 'omeViewer'"
              :datasetInfo="datasetInfo" :file="file" @download-file="executeDownload" />
          </KeepAlive>
        </content-tab-card>
        <file-viewer-metadata v-if="!hasViewer" :datasetInfo="datasetInfo" :file="file"
          @download-file="executeDownload" />
      </div>
      <div v-if="hasRelatedDatasets" class="container">
        <div class="subpage">
          <div class="heading3 mb-16">
            Find related images among other datasets that share the same award id
          </div>
          <gallery galleryItemType="relatedDatasets" :items="relatedDatasets" :cardWidth="12" />
        </div>
      </div>
    </div>
  </client-only>
</template>

<script>
import discover from '@/services/discover'
import scicrunch from '@/services/scicrunch'
import PlotViewer from '@/components/PlotViewer/PlotViewer.vue'
import VideoViewer from '@/components/VideoViewer/VideoViewer'
import OmeViewerComponent from '@/components/OmeViewer/OmeViewer.client.vue'
import OrthogonalViewer from '@/components/OrthogonalViewer/OrthogonalViewer.client.vue'
import FileViewerMetadata from '@/components/ViewersMetadata/FileViewerMetadata.vue'
import FormatDate from '@/mixins/format-date'
import FetchPennsieveFile from '@/mixins/fetch-pennsieve-file'
import FileDetails from '@/mixins/file-details'
import Gallery from '@/components/Gallery/Gallery.vue'

import { extractS3BucketName } from '@/utils/common'

import { isEmpty, pathOr, propOr } from 'ramda'

export default {
  name: 'DatasetFileDetailPage',

  components: {
    PlotViewer,
    VideoViewer,
    OmeViewerComponent,
    OrthogonalViewer,
    FileViewerMetadata,
    Gallery
  },

  mixins: [
    FormatDate,
    FetchPennsieveFile,
    FileDetails
  ],

  async setup() {
    const router = useRouter()
    const route = useRoute()
    const config = useRuntimeConfig()
    const { $axios, $pennsieveApiClient, $algoliaClient } = useNuxtApp()
    const url = `${config.public.discover_api_host}/datasets/${route.params.datasetId}`
    var datasetUrl = route.params.datasetVersion ? `${url}/versions/${route.params.datasetVersion}` : url
    let datasetInfo = {}
    await $pennsieveApiClient.value.get(datasetUrl).catch(e => {
      console.log(`Could not get the dataset's info: ${e}`)
    }).then(({ data }) => {
      datasetInfo = data
    })
    const s3Bucket = datasetInfo ? extractS3BucketName(datasetInfo.uri) : undefined
    const filePath = route.query.path
    const file = await FetchPennsieveFile.methods.fetchPennsieveFile(
      filePath,
      route.params.datasetId,
      route.params.datasetVersion
    )

    let packageType =
      file.packageType == 'Unsupported' ? 'Unsupported' : // Segmentation
          'Others' // All other types of files, e.g. plot, video, timeseries, etc.

    let sourcePackageId = ""
    // We must remove the N: in order for scicrunch to realize the package
    sourcePackageId = file.sourcePackageId
    const expectedScicrunchIdentifier = sourcePackageId != undefined ? sourcePackageId.replace("N:", "") : ""
    let scicrunchData = {}
    try {
      if ((packageType == 'Others' || packageType == 'Image') &&
        expectedScicrunchIdentifier != "") {
        const scicrunchResponse = await scicrunch.getDatasetInfoFromObjectIdentifier(expectedScicrunchIdentifier)
        const result = pathOr([], ['data', 'result'], scicrunchResponse)
        scicrunchData = result?.length > 0 ? result[0] : []
      }
    } catch(e) {
      console.log(`Error retrieving sci crunch data (possibly because there is none for this file): ${e}`)
    }

    let hasSimulationViewer = false

    scicrunchData['abi-simulation-omex-file']?.find(function(el) {
      if (el.identifier == expectedScicrunchIdentifier) {
        hasSimulationViewer = true
        return true
      }
      return false
    })

    let plotInfo = {}
    const matchedplotInfo = scicrunchData['abi-plot']?.filter(function(el) {
      return el.identifier == expectedScicrunchIdentifier
    })
    plotInfo = matchedplotInfo?.length > 0 ? matchedplotInfo[0] : {}
    const hasPlotViewer = !isEmpty(plotInfo)

    let videoData = {}
    const matchedVideoData = scicrunchData['video']?.filter(function(el) {
      return el.identifier == expectedScicrunchIdentifier
    })
    videoData = matchedVideoData?.length > 0 ? matchedVideoData[0] : {}
    const hasVideoViewer = !isEmpty(videoData)
    let signedUrl = ""
    if (hasVideoViewer) {
      const videoConfig = {
        params: {
          key: `${route.params.datasetId}/${filePath}`,
          contentType: videoData.mimetype.name,
          s3BucketName: s3Bucket
        }
      }
      signedUrl = await $axios.get(
          `${config.public.portal_api}/download`,
          videoConfig
        )
        .then(({ data }) => {
          return data
        })
    }

    if (sourcePackageId !== 'details') {
      packageType = file.packageType
    }
    const hasTimeseriesViewer = packageType === 'TimeSeries'
    if (hasTimeseriesViewer && config.public.SHOW_TIMESERIES_VIEWER == 'true') {
      router.push(`/datasets/timeseriesviewer?dataset_id=${route.params.datasetId}&dataset_version=${route.params.datasetVersion}&file_path=${filePath}`)
    }

    // Check for OME-TIFF files by filename
    const isOmeTiffFile = (fileName) => {
      if (!fileName) return false
      const lowerName = fileName.toLowerCase()
      return lowerName.endsWith('.ome.tiff') || lowerName.endsWith('.ome.tif')
    }
    const hasOmeViewer = isOmeTiffFile(file.name)

    // Fetch orthogonal viewer assets (ome-zarr / neuroglancer-precomputed) for this package.
    // The api2 endpoint returns ready zarr assets regardless of source file type
    // (nii.gz and ome.tiff packages are server-side converted to zarr).
    let viewerAssets = []
    if (sourcePackageId) {
      const { fetchViewerAssets } = useViewerAssets()
      const result = await fetchViewerAssets(sourcePackageId)
      viewerAssets = result.assets
    }
    const hasOrthogonalViewer = viewerAssets.length > 0

    const activeTabId = ref(hasOrthogonalViewer ? 'orthogonalViewer-0' :
      hasOmeViewer ? 'omeViewer' :
      hasTimeseriesViewer ? 'timeseriesViewer' :
      hasSimulationViewer ? 'simulationViewer' :
      hasPlotViewer ? 'plotViewer' :
      hasVideoViewer ? 'videoViewer' : '')

    const algoliaIndex = await $algoliaClient.initIndex(config.public.ALGOLIA_INDEX)
    const { supportingAwards } = await algoliaIndex.getObject(route.params.datasetId)
    const awardIds = supportingAwards.map(award => award.identifier).filter(identifier => identifier != undefined)
    let relatedDatasets = []
    try {
      relatedDatasets = await Promise.all(
        awardIds.map(async (awardId) => {
          const { data } = await $axios.get(`${config.public.portal_api}/project/${awardId}`)
          return data
        })
      )
      relatedDatasets = relatedDatasets.flat()
    } catch (error) {
        console.error('Error fetching related datasets:', error)
    }
    relatedDatasets = relatedDatasets.map((dataset) => {
      const datasetId = propOr('', 'objectID', dataset)
      const datasetName = pathOr('', ['pennsieve', 'name'], dataset)
      const datasetDescription = pathOr('', ['pennsieve', 'description'], dataset)
      const datasetBanner = pathOr('', ['pennsieve', 'banner', 'uri'], dataset)

      return {
        'name': datasetName,
        'description': datasetDescription,
        'id': datasetId,
        'banner': datasetBanner
      }
    })

    return {
      videoData,
      plotInfo,
      file,
      hasPlotViewer,
      hasSimulationViewer,
      hasVideoViewer,
      hasOmeViewer,
      hasOrthogonalViewer,
      viewerAssets,
      sourcePackageId,
      signedUrl,
      packageType,
      activeTabId,
      datasetInfo,
      relatedDatasets
    }
  },

  data: () => {
    const config = useRuntimeConfig()
    return {
      apiLocation: config.public.portal_api,
      tabs: [],
      file: {},
      zipData: '',
      zipitUrl: config.public.zipit_api_host,
      helpers: {
        simulationViewer: {
          name: 'Simulation Viewer',
          link: 'simulation-viewer-overview'
        },
        plotViewer: {
          name: 'Plot Viewer',
          link: 'plot-viewer'
        },
        omeViewer: {
          name: 'OME-TIFF Viewer',
          link: 'ome-tiff-viewer'
        },
        orthogonalViewer: {
          name: 'Orthogonal Viewer',
          link: 'orthogonal-viewer'
        }
      }
    }
  },

  computed: {
    hasViewer: function() {
      return this.hasSimulationViewer ||
        this.hasPlotViewer || this.hasVideoViewer || this.hasOmeViewer ||
        this.hasOrthogonalViewer
    },
    activeHelperId: function() {
      // Orthogonal tab ids are suffixed per asset (orthogonalViewer-0); map back
      // to the single helper entry.
      if (typeof this.activeTabId === 'string' && this.activeTabId.startsWith('orthogonalViewer')) {
        return 'orthogonalViewer'
      }
      return this.activeTabId
    },
    datasetId: function() {
      return this.$route.params.datasetId
    },
    readme: function() {
      return propOr('', 'readme', this.datasetInfo)
    },
    hasRelatedDatasets() {
      return !isEmpty(this.relatedDatasets)
    },
    breadcrumb: function() {
      return [
        {
          to: {
            name: 'index'
          },
          label: 'Home'
        },
        {
          to: {
            name: 'data'
          },
          label: 'Data & Models'
        },
        {
          to: {
            name: 'datasets-datasetId',
            params: {
              datasetId: this.datasetInfo.id
            },
          },
          label: `${this.datasetInfo.name}`
        },
        {
          to: {
            name: 'datasets-datasetId',
            params: {
              datasetId: this.datasetInfo.id
            },
            query: {
              datasetDetailsTab: 'files',
              path: `${this.fileFolderLocation}`
            }
          },
          label: 'File'
        }
      ]
    }
  },

  watch: {
    hasPlotViewer: {
      handler: function(hasViewer) {
        if (hasViewer) {
          this.tabs.push({
            label: 'Plot Viewer',
            id: 'plotViewer'
          })
        } else {
          this.tabs = this.tabs.filter(tab => tab.id !== 'plotViewer')
        }
      },
      immediate: true
    },
    hasSimulationViewer: {
      handler: function(hasViewer) {
        if (hasViewer) {
          this.tabs.push({
            label: 'Simulation Viewer',
            id: 'simulationViewer'
          })
        } else {
          this.tabs = this.tabs.filter(tab => tab.id !== 'simulationViewer')
        }
      },
      immediate: true
    },
    hasVideoViewer: {
      handler: function(hasViewer) {
        if (hasViewer) {
          this.tabs.push({
            label: 'Video Viewer',
            id: 'videoViewer'
          })
        } else {
          this.tabs = this.tabs.filter(tab => tab.id !== 'videoViewer')
        }
      },
      immediate: true
    },
    hasOmeViewer: {
      handler: function(hasViewer) {
        if (hasViewer) {
          this.tabs.push({
            label: 'OME-TIFF Viewer',
            id: 'omeViewer'
          })
        } else {
          this.tabs = this.tabs.filter(tab => tab.id !== 'omeViewer')
        }
      },
      immediate: true
    },
    hasOrthogonalViewer: {
      handler: function(hasViewer) {
        // Remove any prior orthogonal tabs, then push one per ready asset.
        this.tabs = this.tabs.filter(tab => !tab.id.startsWith('orthogonalViewer'))
        if (hasViewer) {
          const orthogonalTabs = this.viewerAssets.map((asset, idx) => ({
            label: asset.name || `Orthogonal Viewer ${idx + 1}`,
            id: `orthogonalViewer-${idx}`
          }))
          // Prepend so orthogonal tabs appear first in the tab order.
          this.tabs = [...orthogonalTabs, ...this.tabs]
        }
      },
      immediate: true
    }
  },

  methods: {
    executeDownload(file) {
      const version = this.$route.params.datasetVersion
      const datasetVersionRegexp = /(?<datasetId>\d*)\/(?<filePath>.*)/
      let params = file.uri.replace("s3://", "")
      let firstIndex = params.indexOf("/") + 1
      params = params.substr(firstIndex)
      const matches = params.match(datasetVersionRegexp)

      const payload = {
        paths: [matches.groups.filePath],
        datasetId: matches.groups.datasetId,
        version: version,
      }

      this.zipData = JSON.stringify(payload, undefined)
      this.$nextTick(() => {
        this.$refs.zipForm.submit() // eslint-disable-line no-undef
      })

      this.$gtm.trackEvent({
        event: 'interaction_event',
        event_name: 'dataset_file_download',
        files: propOr('', 'paths', payload),
        file_name: '',
        file_path: '',
        file_type: '',
        location: '',
        category: '',
        dataset_id: matches.groups.datasetId,
        version_id: version,
        doi: '',
        citation_type: ''
      })
    },
    /**
     * Checks if file is MS Word, MS Excel, or MS Powerpoint
     * @param {Object} file
     */
    isMicrosoftFileType: function(file) {
      return (
        file.fileType == 'MSWord' ||
        file.fileType == 'MSExcel' ||
        file.fileType == 'PowerPoint'
      )
    },
  }
}
</script>

<style lang="scss" scoped>
@import 'sparc-design-system-components-2/src/assets/_variables.scss';

.page-data {
  background-color: $background;
}
.help-link {
  float: right;
  @media screen and (max-width: 29rem) {
    float: none;
  }
}
.help-icon {
  color: $purple;
    height: 1.5rem;
    width: 1.5rem;
}
</style>
