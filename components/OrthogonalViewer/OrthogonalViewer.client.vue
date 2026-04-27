<template>
  <div class="orthogonal-viewer-container">
    <div class="viewer-wrapper">
      <OrthogonalFrame
        v-if="asset && asset.asset_url"
        :source="asset.asset_url"
        :embed-url="embedUrl"
        :cloudfront="asset.cloudfront || null"
        @ready="onReady"
        @error="onError"
      />
    </div>
    <generic-viewer-metadata
      :datasetInfo="datasetInfo"
      :file="file"
      @download-file="$emit('download-file', $event)"
    />
  </div>
</template>

<script>
import { defineComponent, defineAsyncComponent } from 'vue'
import GenericViewerMetadata from '@/components/ViewersMetadata/GenericViewerMetadata.vue'
import '@pennsieve-viz/core/style.css'

// Lazy so @pennsieve-viz/core (which touches `document` at module load) only
// evaluates in the browser, avoiding SSR ReferenceError.
const OrthogonalFrame = defineAsyncComponent(() =>
  import('@pennsieve-viz/core').then((m) => m.OrthogonalFrame)
)

export default defineComponent({
  name: 'OrthogonalViewer',

  components: {
    GenericViewerMetadata,
    OrthogonalFrame,
  },

  props: {
    asset: {
      type: Object,
      default: () => ({}),
    },
    file: {
      type: Object,
      default: () => ({}),
    },
    datasetInfo: {
      type: Object,
      default: () => ({}),
    },
  },

  emits: ['download-file'],

  setup() {
    const config = useRuntimeConfig()
    const embedUrl = config.public.orthogonal_viewer_url

    const onReady = () => {}
    const onError = (message) => {
      console.error('Orthogonal viewer error:', message)
    }

    return {
      embedUrl,
      onReady,
      onError,
    }
  },
})
</script>

<style lang="scss" scoped>
@import '@/assets/_viewer.scss';

.orthogonal-viewer-container {
  width: 100%;
}

.viewer-wrapper {
  width: 100%;
  min-height: 75vh;
  height: 75vh;
  display: flex;
  flex-direction: column;
  border: 1px solid #dcdfe6;
  border-radius: 4px;
  overflow: hidden;
  margin-bottom: 1rem;

  > * {
    flex: 1 1 auto;
    min-height: 0;
  }
}
</style>
