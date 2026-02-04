<template>
  <div class="ome-viewer-container">
    <div v-if="isLoading" class="loading-container">
      <el-icon class="is-loading"><Loading /></el-icon>
      <span class="ml-8">Loading OME-TIFF viewer...</span>
    </div>
    <div v-else-if="hasError" class="error-container">
      <p class="error">{{ errorMessage }}</p>
    </div>
    <template v-else>
      <div class="viewer-wrapper">
        <MicroCtOmeViewer
          v-if="presignedUrl"
          :source="presignedUrl"
          source-type="ome-tiff"
        />
      </div>
      <generic-viewer-metadata
        :datasetInfo="datasetInfo"
        :file="file"
        @download-file="$emit('download-file', $event)"
      />
    </template>
  </div>
</template>

<script>
import { ref, onMounted, defineComponent } from 'vue'
import { propOr } from 'ramda'
import GenericViewerMetadata from '@/components/ViewersMetadata/GenericViewerMetadata.vue'
import { OmeViewer as MicroCtOmeViewer } from '@pennsieve-viz/micro-ct'

import '@pennsieve-viz/micro-ct/style.css'

export default defineComponent({
  name: 'OmeViewerWrapper',

  components: {
    GenericViewerMetadata,
    MicroCtOmeViewer,
  },

  props: {
    file: {
      type: Object,
      default: () => ({})
    },
    datasetInfo: {
      type: Object,
      default: () => ({})
    },
  },

  emits: ['download-file'],

  async setup(props) {
    const { $axios } = useNuxtApp()
    const config = useRuntimeConfig()

    const presignedUrl = ref('')
    const isLoading = ref(true)
    const hasError = ref(false)
    const errorMessage = ref('')

    const discoverUrl = config.public.discover_api_host

    const fetchManifestUrl = async (datasetId, version, filePath) => {
      try {
        const response = await $axios.post(
          `${discoverUrl}/datasets/${datasetId}/versions/${version}/files/download-manifest`,
          { paths: [filePath] }
        )
        return response?.data?.data?.[0]?.url || ''
      } catch (error) {
        console.error('Error fetching presigned URL:', error)
        return ''
      }
    }

    const loadViewer = async () => {
      isLoading.value = true
      hasError.value = false
      errorMessage.value = ''

      try {
        const datasetId = propOr('', 'id', props.datasetInfo)
        const version = propOr('', 'version', props.datasetInfo)
        const filePath = propOr('', 'path', props.file)

        if (!filePath) {
          throw new Error('No file path provided')
        }

        if (!datasetId || !version) {
          throw new Error('Missing dataset ID or version')
        }

        // Get presigned URL from download manifest
        const url = await fetchManifestUrl(datasetId, version, filePath)

        if (!url) {
          throw new Error('Failed to get presigned URL for file')
        }

        presignedUrl.value = url
      } catch (error) {
        console.error('Error loading OME viewer:', error)
        hasError.value = true
        errorMessage.value = error.message || 'Failed to load OME-TIFF viewer'
      } finally {
        isLoading.value = false
      }
    }

    onMounted(() => {
      loadViewer()
    })

    return {
      presignedUrl,
      isLoading,
      hasError,
      errorMessage,
      loadViewer,
    }
  },
})
</script>

<style lang="scss" scoped>
@import '@/assets/_viewer.scss';

.ome-viewer-container {
  width: 100%;
}

.loading-container {
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 2rem;

  .is-loading {
    font-size: 1.5rem;
    animation: rotating 2s linear infinite;
  }
}

.error-container {
  text-align: center;
  padding: 2rem;

  .error {
    color: #f56c6c;
    margin-bottom: 1rem;
  }
}

.viewer-wrapper {
  width: 100%;
  min-height: 500px;
  border: 1px solid #dcdfe6;
  border-radius: 4px;
  overflow: hidden;
  margin-bottom: 1rem;

  :deep(.ome-viewer-wrapper) {
    width: 100%;
    min-height: 500px;
    height: 100%;
  }
}

@keyframes rotating {
  from {
    transform: rotate(0deg);
  }
  to {
    transform: rotate(360deg);
  }
}
</style>
