<template>
  <div class="plot-viewer-page">
    <div class="page-wrap container">
      <div class="plotvuer-container">
        <plot-vuer
          v-if="source_url"
          :data-source="{ url: source_url }"
          :metadata="metadata"
          :supplemental-data="supplemental_data"
        />
      </div>
      <plot-viewer-metadata
        :plotType="plotType"
        :file="file"
        :datasetInfo="datasetInfo"
      />
    </div>
  </div>
</template>

<script>
import PlotViewerMetadata from "@/components/ViewersMetadata/PlotViewerMetadata.vue"

import discover from '@/services/discover'
import { extractS3BucketName } from '@/utils/common'
import { pathOr, propOr } from 'ramda'

export default {
  name: 'PlotViewer',

  components: {
    PlotViewerMetadata,
    PlotVuer: process.client
      ? () => import('@abi-software/plotvuer').then(m => m.PlotVuer)
      : null
  },

  props: {
    plotData: {
      type: Object,
      default: () => {
        return {
          share_link: '',
          status: ''
        }
      }
    },
    file: {
      type: Object,
      default: () => {}
    },
    datasetInfo: {
      type: Object,
      default: () => {}
    },
  },

  async setup(props) {
    const { $portalApiClient } = useNuxtApp()
    try {
      const s3Bucket = props.datasetInfo ? extractS3BucketName(props.datasetInfo.uri) : undefined

      const plot_annotation = props.plotData.datacite
      const file_path = `${props.datasetInfo.id}/files/${props.plotData.dataset.path}`
      const source_url_response = await discover.downloadLink($portalApiClient, file_path, s3Bucket)
      let source_url = source_url_response.data

      const metadata = JSON.parse(
        plot_annotation.supplemental_json_metadata.description
      )

      let supplemental_data = []
      if (plot_annotation.isDescribedBy) {
        let tmp_path = plot_annotation.isDescribedBy.path
        // Hack to fix path entry.
        if (tmp_path === '../derivative/sub-1/subject1_header.txt') {
          tmp_path = 'derivative/sub-1/sam-1/subject1_header.txt'
        }

        const supplemental_file_path = `${props.datasetInfo.id}/files/${tmp_path}`

        const supplemental_url_response = await discover.downloadLink(
          $portalApiClient,
          supplemental_file_path,
          s3Bucket
        )
        let supplemental_url = supplemental_url_response.data
        supplemental_data.push({
          url: supplemental_url
        })
      }
      return {
        source_url,
        metadata: metadata ? metadata : {
          version: "1.1.0",
          type: "plot",
          attrs: {
            style: "timeseries"
          }
        },
        supplemental_data
      }
    } catch(e) {
      console.log(e)
    }
  },

  computed: {
    plotType: function() {
      return pathOr("", ['attrs','style'], this.metadata)
    },
    /**
     * Return the dataset's name.
     * @returns String
     */
    datasetTitle: function() {
      return this.datasetInfo ? this.datasetInfo.name : 'Go to dataset'
    },
    datasetId() {
      return propOr(undefined, "id", this.datasetInfo)
    },
    versionId() {
      return propOr(undefined, "version", this.datasetInfo)
    },
  }
}
</script>

<style lang="scss">
.plotvuer-container {
  margin-top: 1.5rem;
  height: 90vh;
  max-width: calc(100% - 48px);
  @import '@abi-software/plotvuer/dist/plotvuer';
}
.page-heading {
  margin-bottom: 1.375rem;
}
</style>
