<template>
  <div>
    <div class="heading2 mb-8">
      Repository
    </div>
    <div class="mb-16">
      The design and code files for the device are stored in a public repository on GitHUB. Please feel free to clone the repository for your usage.
    </div>
    <div class="mb-16"><span class="label4">Repository Link: </span><a target="_blank" :href="repoLink">{{ repoLink }}</a></div>
    <div class="flex-col">
      <a
        class="inherit-width"
        :href="repoLink"
        target="_blank"
      >
        <el-button class="inherit-width">
          Visit Repository <svgo-icon-open class="icon-open" />
        </el-button>
      </a>
      <a
      class="inherit-width"
      :href="osparcLink"
      target="_blank"
      :style="{ display: osparcLink === undefined ? 'none' : 'block' }"
      >
        <el-button class="secondary no-shadow inherit-width">
          Run on o²S²PARC <svgo-icon-open class="icon-open" />
        </el-button>
      </a>
    </div>
  </div>
</template>

<script>
export default {
  name: 'SourceCodeInfo',
  props: {
    repoLink: {
      type: String,
      default: () => "",
      required: true
    },
    osparcLink: {
      type: String,
      default: () => undefined,
      required: true
    },
  }
}
</script>

<style lang="scss" scoped>
.icon-open {
  height: 1.5rem;
  width: 1.5rem;
  margin-top: 2px;
}
.flex-col {
  display: flex;
  flex-direction: column;
  gap: 0.5rem;
  width: 160px;
}
.inherit-width {
  width: inherit;
}
.no-shadow {
  box-shadow: none;
}
</style>
