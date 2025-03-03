<template>
  <div class="metric-container pt-0 px-16 pb-16">
    <el-tooltip
      v-if="tooltip"
      placement="bottom"
      popper-class="consortia-tooltips"
      effect="customized"
    >
      <template #default>
        <img
          class="icon"
          :style="imageStyle"
          :src=iconUrl
        />
      </template>
      <template #content>
        {{ tooltip }}
      </template>
    </el-tooltip>
    <img
      v-else
      class="icon"
      :style="imageStyle"
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
    tooltip() {
      return pathOr('', ['fields','buttonText'], this.metric)
    },
    imageStyle() {
      if (this.textColor == "") return
      return {
        border: `1px solid #${this.textColor}`
      }
    }
  },
}
</script>

<style lang="scss" scoped>
@import 'sparc-design-system-components-2/src/assets/_variables.scss';
.metric-container {
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
  margin-right: .5rem;
}
img {
  border-radius: 50%;
  margin-bottom: 8px;
  height: 128px;
  width: 128px;
  object-fit: contain;
}
</style>
