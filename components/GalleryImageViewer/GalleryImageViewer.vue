<template>
  <el-dialog
    :model-value="modelValue"
    class="gallery-image-viewer"
    width="90%"
    top="4vh"
    append-to-body
    destroy-on-close
    @update:model-value="$emit('update:modelValue', $event)"
  >
    <template #header>
      <div v-if="item?.filePageLink" class="mb-8">
        <nuxt-link :to="item.filePageLink" @click="$emit('update:modelValue', false)">View file page</nuxt-link>
      </div>
      <span class="heading2">{{ item?.title || 'Image' }}</span>
    </template>
    <div v-if="item">
      <div v-if="!item.file" v-loading="item.fileLoading" class="file-loading">
        <p v-if="item.fileError">Couldn't load this file's details. Try again later.</p>
      </div>
      <template v-else>
        <orthogonal-viewer
          v-if="showViewer"
          :asset="item.zarrAsset"
          :datasetInfo="datasetInfo"
          :file="item.file"
          @download-file="executeDownload"
        />
        <template v-else>
          <img class="thumbnail-preview" :src="item.thumbnail" :alt="item.title" />
          <generic-viewer-metadata :datasetInfo="datasetInfo" :file="item.file" @download-file="executeDownload" />
        </template>
      </template>
    </div>
  </el-dialog>
</template>

<script>
import OrthogonalViewer from '@/components/OrthogonalViewer/OrthogonalViewer.client.vue'
import GenericViewerMetadata from '@/components/ViewersMetadata/GenericViewerMetadata.vue'
import { downloadPublicFile } from '@/composables/usePublicFileLink'
import { failMessage } from '@/utils/notification-messages'
import { filePathOf } from '@/utils/publicDownloads'

/**
 * Popup for a dataset gallery image: the ome-zarr viewer and the file's details, like the
 * file page but without tabs. `item` is an ImagesGallery thumbnail item; its `file` is
 * resolved by the parent (shown loading until then).
 */
export default {
  name: 'GalleryImageViewer',
  components: { OrthogonalViewer, GenericViewerMetadata },
  props: {
    modelValue: { type: Boolean, default: false },
    item: { type: Object, default: null },
    datasetInfo: { type: Object, default: () => ({}) },
  },
  emits: ['update:modelValue'],
  watch: {
    // Links inside (e.g. "File location" to the Files tab) can stay on the dataset page.
    '$route.fullPath'() {
      if (this.modelValue) this.$emit('update:modelValue', false)
    },
  },
  computed: {
    showViewer() {
      return !!this.item?.zarrAsset && this.$config.public.SHOW_ORTHOGONAL_VIEWER == 'true'
    },
  },
  methods: {
    executeDownload(file) {
      const datasetId = this.datasetInfo.id
      const version = this.datasetInfo.version
      const path = filePathOf({ uri: file.uri })
      downloadPublicFile({ datasetId, version, path }).catch((e) => {
        failMessage(e.message || "Couldn't download the file. Try again.")
      })
      this.$gtm.trackEvent({
        event: 'interaction_event',
        event_name: 'dataset_file_download',
        files: [path],
        file_name: '',
        file_path: '',
        file_type: '',
        location: 'gallery_image_viewer',
        category: '',
        dataset_id: datasetId,
        version_id: version,
        doi: '',
        citation_type: '',
      })
    },
  },
}
</script>

<style lang="scss">
// Unscoped: el-dialog is teleported to <body>.
.gallery-image-viewer {
  .file-loading {
    min-height: 8rem;
  }
  .thumbnail-preview {
    display: block;
    max-width: 100%;
    max-height: 50vh;
    margin: 0 auto 1rem;
  }
  .viewer-wrapper {
    height: 65vh;
    min-height: 65vh;
  }
}
</style>
