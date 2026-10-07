<template>
  <div>
    <el-button class="secondary alt" @click="onDownloadClick" :disabled="disabled">
      Download Selected Files and Folders
    </el-button>
    <el-dialog
      v-model="confirmDownloadVisible"
      :width="showReduceSize ? 'clamp(min(760px, 92vw), 50%, 92vw)' : undefined"
      show-close
      @close="closeConfirmDownload"
    >
      <template #header>
        <div class="mb-16">
          Confirm Download
        </div>
      </template>
      <div class="bf-dialog-body">
        <div v-if="showReduceSize" class="mb-24">
          <p>
            The file(s) you are trying to download are {{ selectedSize }},
            more than the limit of {{ maxDownloadSize }} for a zip archive.
            Download them with the Pennsieve agent instead:
          </p>
          <agent-download-command
            :dataset-id="dataset.id"
            :version="dataset.version"
            :paths="selectedPaths"
            :folder-name="archiveName"
            :aws-uri="awsUri"
            :aws-items="awsItems"
          />
        </div>
        <div v-else-if="selected.length > 1" class="download-name mb-16">
          <label for="downloadName">
            File Name
          </label>
          <el-input id="downloadName" v-model="archiveName" />
          <span>.zip</span>
        </div>
      </div>
      <template #footer>
        <div class="dialog-footer">
          <el-button class="secondary" @click="closeConfirmDownload">
            {{ showReduceSize ? 'Close' : 'Cancel' }}
          </el-button>
          <el-button v-if="!showReduceSize" :disabled="downloadDisabled" @click="confirmDownload">
            Download
          </el-button>
        </div>
      </template>
    </el-dialog>
  </div>
</template>

<script>
import StorageMetrics from '@/mixins/bf-storage-metrics'
import AgentDownloadCommand from '@/components/AgentDownloadCommand/AgentDownloadCommand.vue'
import { downloadPublicFile } from '@/composables/usePublicFileLink'
import { failMessage, infoMessage } from '@/utils/notification-messages'

// Selected files and folders: one file downloads through a download-service
// link; folders and several files as a zip that download-service builds
// (start-archive, for the files table to follow); more than the limit with
// the Pennsieve agent.
export default {
  name: 'BfDownloadFile',

  components: {
    AgentDownloadCommand
  },

  mixins: [StorageMetrics],

  props: {
    selected: {
      type: Array,
      default: () => {
        return []
      }
    },
    dataset: {
      type: Object,
      default: () => {
        return {}
      }
    },
    disabled: {
      type: Boolean,
      default: false
    },
    // A zip is being prepared
    busy: {
      type: Boolean,
      default: false
    },
    // The latest version's S3 location, for the AWS CLI alternative to the
    // agent; empty for older versions
    awsUri: {
      type: String,
      default: ''
    }
  },

  emits: ['start-archive'],

  data(props) {
    return {
      confirmDownloadVisible: false,
      archiveName: `sparc-portal-dataset-${this.dataset.id}-version-${this.dataset.version}-data`,
      showReduceSize: false,
      downloadConfirmed: false
    }
  },

  computed: {
    /**
     * download is disabled if the total size is greater than the threshold, or no rows are selected
     * @returns {Boolean}
     */
    downloadDisabled() {
      if (this.selected.length === 0) return true
      const totalSize = this.selected.reduce(
        (total, node) => total + node.size || 0,
        0
      )

      return totalSize > this.$config.public.max_download_size
    },

    /**
     * determines whether the confirm download dialog should open
     * @returns {Boolean}
     */
    shouldConfirmDownload() {
      return (
        this.downloadDisabled ||
        (this.selected.length > 1 && !this.downloadConfirmed)
      )
    },

    /**
     * Compute max size for download
     * @returns {Number}
     */
    maxDownloadSize() {
      return this.formatMetric(this.$config.public.max_download_size)
    },

    selectedSize() {
      return this.formatMetric(this.selected.reduce((total, node) => total + (node.size || 0), 0))
    },

    selectedPaths() {
      return this.selected.map(f => f.path)
    },

    awsItems() {
      return this.selected.map(f => ({ path: f.path, isFolder: f.type === 'Directory' }))
    }
  },

  methods: {
    /**
     * Show the confirm dialog if downloading multiple files
     * Otherwise, just download the file
     */
    onDownloadClick() {
      if (this.shouldConfirmDownload) {
        this.showReduceSize = this.downloadDisabled
        this.confirmDownloadVisible = true
      } else {
        this.executeDownload()
      }
    },

    /**
     * Confirm to start the download, or show the
     */
    confirmDownload() {
      this.downloadConfirmed = true
      this.onDownloadClick()
    },

    executeDownload() {
      const oneFile = this.selected.length === 1 && this.selected[0].type !== 'Directory'
      if (!oneFile && this.busy) {
        infoMessage('Another download is being prepared; wait for it to finish.')
        this.closeConfirmDownload()
        return
      }

      if (this.archiveName == "") {
        this.archiveName = `sparc-portal-dataset-${this.dataset.id}-version-${this.dataset.version}-data`
      }
      const payload = {
        paths: oneFile ? this.selectedPaths : [...this.selectedPaths, "manifest.json"],
        archiveName: this.archiveName
      }

      if (oneFile) {
        downloadPublicFile({ datasetId: this.dataset.id, version: this.dataset.version, path: payload.paths[0] }).catch(e => {
          failMessage(e.message || "Couldn't download the file. Try again.")
        })
      } else {
        this.$emit('start-archive', payload)
      }
      this.$gtm.trackEvent({
        event: 'interaction_event',
        event_name: 'dataset_file_download',
        files: payload.paths,
        file_name: "",
        file_path: "",
        file_type: "",
        category: "",
        dataset_id: this.dataset.id,
        version_id: this.dataset.version,
        doi: "",
        citation_type: "",
        location: ""
      })
      this.closeConfirmDownload()
    },

    closeConfirmDownload() {
      this.downloadConfirmed = false
      this.showReduceSize = false
      this.confirmDownloadVisible = false
    }
  }
}
</script>

<style lang="scss" scoped>
.bf-dialog-header {
  align-items: center;
  display: flex;
  position: relative;
}
.bf-dialog-header-title {
  flex: 1;
  font-size: 18px;
  font-weight: 400;
  line-height: 1;
  margin-right: 8px;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
  color: #000;
}

.bf-dialog-body {
  word-break: normal;
}

.download-name {
  display: flex;
  align-items: center;
  label {
    min-width: 64px;
  }
  :deep(.el-input) {
    margin: 0 8px;
  }
}
</style>
