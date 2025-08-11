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
        class="fit-width"
        :href="repoLink"
        target="_blank"
      >
        <el-button>
          Visit Repository <svgo-icon-open class="icon-open" />
        </el-button>
      </a>
      <a
      class="fit-width"
      :href="osparcLink"
      target="_blank"
      >
        <el-button class="secondary no-shadow">
          Run on Osparc <svgo-icon-open class="icon-open" />
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
      default: () => "",
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
}
.fit-width {
  width: fit-content;
}
.no-shadow {
  box-shadow: none;
}
</style>
