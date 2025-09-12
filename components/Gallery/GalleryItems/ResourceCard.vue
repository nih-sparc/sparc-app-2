<template>
  <el-card :style="{ border: 'none', maxWidth: '100%' }" class="card">
    <div class="horizontal-card-content">
      <div class="card-left-section mr-16">
        <div class="image-container mb-16">
          <img class="thumbnail" :src="thumbnailUrl" alt="thumbnail loading ..." />
        </div>
      </div>
      <div class="card-right-section">
        <div class="title-container">
          <div class="title heading2">
            {{title}}
          </div>
        </div>
        <div class="heading3">
          {{subtitle}}
        </div>
        <div class="body1 mb-16">
          {{truncatedDescription}}
        </div>
        <a v-if="buttonLink !== null" :href="buttonLink" target="_blank">
          <el-button class="secondary">
            Learn More <svgo-icon-open class="open-icon" />
          </el-button>
        </a>
      </div>
    </div>
  </el-card>
</template>

<script>
import SparcPill from '@/components/SparcPill/SparcPill.vue'
export default {
  name: 'ResourceCard',
  components: {
    SparcPill
  },
  props: {
    width: {
      type: Number,
      default: 13.8
    },
    title: {
      type: String,
      default: ''
    },
    showSparcTag: {
      type: Boolean,
      default: false
    },
    subtitle: {
      type: String,
      default: null
    },
    description: {
      type: String,
      default: null
    },
    buttonLink: {
      type: String,
      default: null
    },
    thumbnailUrl: {
      type: String,
      default: null
    },
    externalUrl: {
      type: String,
      default: null
    },
  },
  computed: {
    truncatedDescription() {
      return this.description?.length > 134 ? 
        `${this.description.substring(0, 134)}...` :
        this.description
    }
  }
}
</script>

<style scoped lang="scss">
@import 'sparc-design-system-components-2/src/assets/_variables.scss';

.card {
  background-color: transparent;
  position: relative;
  cursor: default;
}
.title-container {
  display: flex;
  align-items: center;
}
.title {
  overflow-x: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}
.thumbnail {
  height: auto;
  width: 100%;
  margin: auto;
}
.image-container {
  display: flex;
  aspect-ratio: 1 / 1;
  border: 2px solid $lineColor1;
  padding: .5rem;
  background-color: white;
  max-width: 10rem;
}
.pill {
  height: fit-content;
}
.horizontal-card-content {
  display: flex; /* Makes this a flex container */
}

.card-image {
  width: 150px; /* Set a specific width for your image */
  margin-right: 20px; /* Add some space between the image and the text */
}

.card-right-section {
  /* This content will take up the remaining space */
  flex-grow: 1;
  max-height: 10rem;
  overflow-y: auto;
}
.open-icon {
  width: 1.5rem;
  height: 1.5rem;
}
</style>
