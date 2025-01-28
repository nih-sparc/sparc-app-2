<template>
  <div class="feature-container pt-0 px-16 pb-16">
    <img
      class="icon"
      :src=iconUrl
    />
    <div class="numbers-container">
      <div class="heading1">
        {{ description }}
      </div>
      <div class="body1">
        {{ title }}
      </div>
    </div>
  </div>
</template>

<script>
import { pathOr } from 'ramda'
import marked from '@/mixins/marked/index'

export default {
  name: 'PortalFeature',

  mixins: [marked],

  props: {
    metric: {
      type: Object,
      default: () => {}
    },
    textColor: {
      type: String,
      default: ""
    }
  },

  computed: {
    description() {
      return pathOr('', ['fields','description'], this.metric)
    },
    title() {
      return pathOr('', ['fields','title'], this.metric)
    },
    iconUrl() {
      return pathOr('', ['fields','icon', 'fields', 'file', 'url'], this.metric)
    },
    descriptionStyle() {
      if (this.textColor == "") return
      return {
        color: `#${this.textColor} !important`,
      }
    }
  },
}
</script>

<style lang="scss" scoped>
@import 'sparc-design-system-components-2/src/assets/_variables.scss';
.feature-container {
  text-align: left;
  display: flex;
  flex-direction: row;
  width: 100%;
  height: fit-content;
}
.numbers-container {
  display: flex;
  flex-direction: column;
  margin: auto;
}
.icon {
  margin: 0 auto;
  height: 6rem;
}
</style>
