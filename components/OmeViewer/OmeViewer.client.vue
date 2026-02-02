<template>
  <div class="ome-viewer-container">
    <div v-if="isLoading" class="loading-container">
      <el-icon class="is-loading"><Loading /></el-icon>
      <span class="ml-8">Loading OME-TIFF viewer...</span>
    </div>
    <div v-else-if="hasError" class="error-container">
      <p class="error">{{ errorMessage }}</p>
      <el-button @click="loadViewer">Try again</el-button>
    </div>
    <template v-else>
      <div class="viewer-wrapper">
        <OmeViewer
          v-if="presignedUrl"
          :url="presignedUrl"
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
import { OmeViewer } from '@pennsieve-viz/micro-ct'

export default defineComponent({
  name: 'OmeViewerWrapper',

  components: {
    GenericViewerMetadata,
    OmeViewer,
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

    const getPackageFiles = async (packageId) => {
      try {
        const response = await $axios.get(
          `${discoverUrl}/packages/N:package:${packageId}/files`
        )
        return response.data
      } catch (error) {
        console.error('Error fetching package files:', error)
        throw error
      }
    }

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
        const sourcePackageId = propOr('', 'sourcePackageId', props.file)

        if (!sourcePackageId) {
          throw new Error('No package ID found for this file')
        }

        // Extract the package ID without the N:package: prefix if present
        const packageId = sourcePackageId.replace('N:package:', '')

        // Step 1: Get package files to find the file path
        const packageFiles = await getPackageFiles(packageId)

        if (!packageFiles || packageFiles.length === 0) {
          throw new Error('No files found in package')
        }

        // Find the OME-TIFF file in the package files
        const omeTiffFile = packageFiles.find(f =>
          f.name?.toLowerCase().endsWith('.ome.tiff') ||
          f.name?.toLowerCase().endsWith('.ome.tif')
        ) || packageFiles[0]

        const filePath = omeTiffFile.path || props.file.path

        // Step 2: Get presigned URL from download manifest
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
