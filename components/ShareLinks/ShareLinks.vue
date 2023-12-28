<template>
  <div class="share-links">
    <ShareNetwork network="facebook" :url="pageUrl" :title="title">
      <sparc-tooltip
        placement="bottom-center"
        content="Share on Facebook"
      >
        <template #item>
          <svgo-icon-share-facebook class="link-icon"/>
        </template>
      </sparc-tooltip>
    </ShareNetwork>
    <ShareNetwork network="twitter" :url="pageUrl" :title="title">
      <sparc-tooltip
        placement="bottom-center"
        content="Share on Twitter"
      >
        <template #item>
          <svgo-icon-share-twitter class="link-icon"/>
        </template>
      </sparc-tooltip>
    </ShareNetwork>
    <ShareNetwork network="linkedin" :url="pageUrl" :title="title">
      <sparc-tooltip
        placement="bottom-center"
        content="Share on LinkedIn"
      >
        <template #item>
          <svgo-icon-share-linked class="link-icon"/>
        </template>
      </sparc-tooltip>
    </ShareNetwork>
    <button class="btn-copy-permalink" @click="copyUrl">
      <sparc-tooltip
        placement="bottom-center"
        content="Copy Link"
      >
        <template #item>
          <svgo-icon-permalink class="link-icon"/>
        </template>
      </sparc-tooltip>
    </button>
  </div>
</template>

<script>
import { successMessage, failMessage } from '@/utils/notification-messages'

export default {
  name: 'ShareLinks',

  setup() {
    const route = useRoute()
    const config = useRuntimeConfig()
    const pageUrl = config.public.ROOT_URL + route.fullPath
    return {
      pageUrl
    }
  },

  props: {
    title: {
      type: String,
      default: ""
    }
  },

  methods: {
    /**
     * Copy file URL to clipboard
     * @param {Object} scope
     */
    copyUrl() {
      navigator.clipboard.writeText(this.pageUrl).then(
        () => {
          successMessage('URL copied to clipboard.')
        },
        () => {
          failMessage('Cannot copy to clipboard.')
        }
      )
    }
  }
}
</script>

<style scoped lang="scss">
@import 'sparc-design-system-components-2/src/assets/_variables.scss';

.btn-copy-permalink {
  border: none;
  background: none;
  color: $purple;
  cursor: pointer;
  padding: 0;
  &:active {
    outline: none;
  }
}

.link-icon {
  height: 1.75rem;
  width: 1.75rem;
}
</style>
