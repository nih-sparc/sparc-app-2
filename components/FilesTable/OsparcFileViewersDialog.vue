<template>
  <el-dialog
    show-close
    v-model="dialogVisible"
    :before-close="beforeClose"
    @opened="openedHandler"
  >
    <template #header>
      <div class="heading3">Select a service</div>
    </template> 
    <div class="content-body pb-32">
      <el-select
        v-model="selectedViewer"
        value-key="title"
        placeholder="Select a service..."
      >
        <el-option
          :value="filePickerDummy"
          :label="filePickerDummy.title"
        />
        <el-option
          v-for="viewer in viewersForFile"
          :key="viewer.title"
          :value="viewer"
          :label="viewer.title"
        />
      </el-select>
      <el-button
        :disabled="selectedViewer === ''"
        :processing="isFetching"
        @click="openFile"
        class="open-btn"
      >
        Open in o²S²PARC
      </el-button>
    </div>
  </el-dialog>
</template>

<script>
import { extractExtension } from '@/utils/utils'
import { usePublicFileLink } from '@/composables/usePublicFileLink'
import { failMessage } from '@/utils/notification-messages'
import { ref } from 'vue'
import { useMainStore } from '@/store/index.js'

export default {
  name: 'OsparcFileViewersDialog',
  props: {
    selectedFile: {
      type: Object,
      default: () => {}
    },
    viewers: {
      type: Object,
      default: () => {}
    },
    showDialog: {
      type: Boolean,
      default: false
    },
    onClose: {
      type: Function
    }
  },
  watch: {
    showDialog: {
      handler: function(show) {
        if (show) {
          this.dialogVisible = true
        }
      }
    },
    dialogVisible: {
      handler: function(show) {
        if (!show) {
          this.$emit('dialog-closed')
          this.selectedViewer = ''
        }
      }
    }
  },
  setup() {
    const config = useRuntimeConfig()
    const osparcViewUrl = new URL(config.public.osparc_host)
    osparcViewUrl.pathname = '/view'
    return {
      osparcViewUrl
    }
  },
  data() {
    return {
      dialogVisible: ref(false),
      selectedViewer: '',
      isFetching: false,
      filePickerDummy: {
        title: "o²S²PARC file service",
        "view_url": this.osparcViewUrl.toString()
      }
    }
  },
  computed: {
    viewersForFile: function() {
      if (this.selectedFile && this.viewers) {
        return this.viewers[this.fileExtension]
      }
      return []
    },
    fileExtension: function() {
      return extractExtension(this.selectedFile.path)
    }
  },
  methods: {
    // oSPARC copies the file into its platform to run the viewer: a download
    openFile() {
      const fileSize = this.selectedFile.size
      const datasetInfo = useMainStore().datasetInfo

      this.isFetching = true

      usePublicFileLink({
        datasetId: datasetInfo.id,
        version: datasetInfo.version,
        path: this.selectedFile.path
      })
        .then(({ url }) => {
          const redirectionUrl = new URL(this.selectedViewer['view_url'])

          redirectionUrl.searchParams.append('download_link', url)
          redirectionUrl.searchParams.append('file_size', fileSize)
          redirectionUrl.searchParams.append('file_type', this.fileExtension)
          if (this.selectedFile.name) {
            redirectionUrl.searchParams.append('file_name', this.selectedFile.name)
          }

          window.open(redirectionUrl, '_blank')
          this.dialogVisible = false
        })
        .catch(() => {
          failMessage('Cannot open the file in o²S²PARC.')
        })
        .finally(() => {
          this.isFetching = false
        })
    },
    beforeClose(done) {
      this.selectedViewer = ''
      done()
    },
    openedHandler() {
      this.selectedViewer = this.filePickerDummy
    },
  }
}
</script>

<style lang="scss" scoped>
.content-body {
  display: flex;
  & > button {
    margin-left: .5em;
  }
}
</style>