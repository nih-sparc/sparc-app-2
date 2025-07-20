<template>
  <div class="simulation-vuer-container">
    <simulation-vuer v-if="ready" :apiLocation="apiLocation" :id="resource" />
  </div>
  <generic-viewer-metadata
    v-if="datasetInfo && file"
    :datasetInfo="datasetInfo"
    :file="file"
  />
</template>

<script>
  import { SimulationVuer } from '@abi-software/simulationvuer'
  import { extractS3BucketName } from "@/utils/common"
  import GenericViewerMetadata from "@/components/ViewersMetadata/GenericViewerMetadata.vue"

  export default {
    name: 'SimulationViewer',
    components: {
      GenericViewerMetadata,
      SimulationVuer,
    },
    props: {
      /**
       * The the URL to the API location.
       */
      apiLocation: {
        required: false,
        type: String,
      },
      /**
       * Dataset information
       */
       datasetInfo: {
        required: false,
        type: Object,
      },
      /**
       * The the URL to the API location.
       */
       file: {
        required: false,
        type: Object,
      },
      /**
       * The ID of the simulation-based dataset.
       */
      id: {
        required: false,
        type: Number,
      },
    },
    data: () => {
      return {
        ready: false,
        resource: undefined,
      }
    },
    mounted: function(){
      if (this.datasetInfo && this.file) {
        const s3Bucket = this.datasetInfo ? extractS3BucketName(this.datasetInfo.uri) : undefined
        this.resource = `${this.apiLocation}/s3-resource/${this.datasetInfo.id}/${this.file.path}?s3BucketName=${s3Bucket}`
      } else if (this.id) {
        this.resource = this.id
      }

      this.ready = true
    },
  }
</script>

<style scope lang="scss">
@import '@abi-software/simulationvuer/dist/style.css';
.simulation-vuer-container {
  height: 600px;
  overflow: hidden;
}
</style>
