<template>
  <div class="share-links">
    <client-only>
      <ShareNetwork network="facebook" :url="pageUrl" :title="title">
        <sparc-tooltip
          placement="bottom-center"
          content="Share on Facebook"
        >
          <svgo-icon-share-facebook class="remove-outline" height="2rem" width="1.75rem"/>
        </sparc-tooltip>
      </ShareNetwork>
      <ShareNetwork network="twitter" :url="pageUrl" :title="title">
        <sparc-tooltip
          placement="bottom-center"
          content="Share on Twitter"
        >
          <svgo-icon-share-twitter class="remove-outline" height="2rem" width="1.75rem"/>
        </sparc-tooltip>
      </ShareNetwork>
      <ShareNetwork network="linkedin" :url="pageUrl" :title="title">
        <sparc-tooltip
          placement="bottom-center"
          content="Share on LinkedIn"
        >
          <svgo-icon-share-linked class="remove-outline" height="2rem" width="1.75rem"/>
        </sparc-tooltip>
      </ShareNetwork>
      <button class="btn-copy-permalink" @click="copyUrl">
        <sparc-tooltip
          placement="bottom-center"
          content="Copy Link"
        >
          <svgo-icon-permalink class="remove-outline" height="2rem" width="1.75rem"/>
        </sparc-tooltip>
      </button>
    </client-only>
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

.remove-outline {
  &:focus {
    outline: none;
  }
}
</style>
