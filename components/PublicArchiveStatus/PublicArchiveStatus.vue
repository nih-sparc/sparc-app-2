<script setup>
import { computed } from 'vue'
import StorageMetrics from '@/mixins/bf-storage-metrics'

// The progress of a zip archive (usePublicArchive), with what can be done
// with it.
const props = defineProps({
  archive: { type: Object, default: null },
  error: { type: String, default: '' },
  starting: { type: Boolean, default: false },
  signedIn: { type: Boolean, default: false },
})

const emit = defineEmits(['download', 'remove'])

const formatMetric = (size) => StorageMetrics.methods.formatMetric.call(StorageMetrics.methods, size)

const status = computed(() => (props.starting ? 'STARTING' : props.archive?.status || ''))
const name = computed(() => props.archive?.archiveName || 'Your download')

const percent = computed(() => {
  const a = props.archive
  if (!a || !a.totalBytes) return 0
  return Math.min(100, Math.round((100 * (a.bytesDone || 0)) / a.totalBytes))
})

const expires = computed(() => {
  const at = props.archive?.expiresAt
  return at ? new Date(at).toLocaleString(undefined, { dateStyle: 'medium', timeStyle: 'short' }) : ''
})
</script>

<template>
  <div v-if="(status && status !== 'CANCELLED') || error" class="public-archive-status">
    <template v-if="status === 'STARTING'">
      <div class="label4">Starting your download…</div>
    </template>

    <template v-else-if="status === 'QUEUED' || status === 'RUNNING'">
      <div class="label4 mb-8">
        Preparing {{ name }}<template v-if="archive.fileCount">:
          {{ archive.filesDone || 0 }} of {{ archive.fileCount }} files</template>
      </div>
      <el-progress :percentage="percent" :show-text="false" :stroke-width="6" color="#8300BF" />
      <div class="mt-8">
        <template v-if="signedIn">
          If you close this window, we'll email you when it's ready. You can
          also come back to this page, in this browser, until {{ expires }}.
        </template>
        <template v-else>
          You can close this window and come back to this page, in this
          browser, until {{ expires }}.
        </template>
        <a href="#" @click.prevent="emit('remove')">Cancel</a>
      </div>
    </template>

    <template v-else-if="status === 'READY'">
      <div class="label4">{{ name }} is ready ({{ formatMetric(archive.archiveBytes) }}).</div>
      <div v-if="archive.skippedCount" class="mt-8">
        {{ archive.skippedCount }} {{ archive.skippedCount === 1 ? "file couldn't" : "files couldn't" }}
        be included; they're listed in FILES_NOT_INCLUDED.txt in the archive.
      </div>
      <div class="mt-8">
        <a href="#" @click.prevent="emit('download')">Download</a>
        · available until {{ expires }} ·
        <a href="#" @click.prevent="emit('remove')">Remove</a>
      </div>
    </template>

    <template v-else-if="status === 'FAILED'">
      <div class="label4">{{ archive.error || 'The download could not be prepared.' }}</div>
      <div class="mt-8">
        <a href="#" @click.prevent="emit('remove')">Dismiss</a>
      </div>
    </template>

    <div v-if="error" class="error mt-8">{{ error }}</div>
  </div>
</template>

<style lang="scss" scoped>
@import 'sparc-design-system-components-2/src/assets/_variables.scss';

.public-archive-status {
  border: 1px solid $lineColor1;
  border-radius: 4px;
  padding: 0.75rem 1rem;
  font-size: 0.875rem;
  line-height: 1.25rem;
  overflow-wrap: anywhere;

  a {
    text-decoration: underline;
  }

  .error {
    color: $danger;
  }
}
</style>
