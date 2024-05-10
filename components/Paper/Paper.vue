<template>
  <div>
    <div class="subpage-col about-page-border">
      <template class="subpage-row">
        <img v-if="logoSrc" class="logo-image mr-16 p-16" :src="logoSrc" />
        <div class="about-page-text" v-html="text" />
      </template>
      <NuxtLink v-if="buttonText != '' && buttonLinkExternal == ''" class="margin-top-auto" :to="buttonLink"
        :target="newTab ? '_blank' : '_self'">
        <el-button class="secondary">
          {{ buttonText }}
        </el-button>
      </NuxtLink>
      <a v-if="buttonText != '' && buttonLinkExternal != ''" class="margin-top-auto" :href="buttonLinkExternal"
        target="_blank">
        <el-button class="secondary">
          {{ buttonText }}
        </el-button>
      </a>
    </div>
    <img v-if="imgSrc" :v-slot="image" class="portal-image midnightblue-background" :src="imgSrc" />
  </div>
</template>

<script>
export default {
  name: 'Paper',
  props: {
    text: {
      type: String,
      default: ''
    },
    buttonLink: {
      type: [Object, String],
      default: null
    },
    buttonLinkExternal: {
      type: String,
      default: ''
    },
    buttonText: {
      type: String,
      default: ''
    },
    imgSrc: {
      type: String,
      default: null
    },
    newTab: {
      type: Boolean,
      default: false
    },
    logoSrc: {
      type: String,
      default: null
    },
  }
}
</script>

<style lang="scss" scoped>
@import 'sparc-design-system-components-2/src/assets/_variables.scss';
.subpage-col {
  display: flex;
  flex-direction: column;
  align-items: flex-start;
  background-color: white;
  padding: 2rem;

  @media screen and (max-width: 767px) {
    margin-top: 0;
  }
  .about-page-text {
    @media screen and (max-width: 767px) {
      margin-left: 0;
    }
  }
}
.subpage-row {
  display: flex;
  flex-direction: row;
}
.about-page-border {
  border: 1px solid #dcdfe6;
}
.margin-top-auto {
  margin-top: auto;
}
.midnightblue-background {
  background-color: midnightblue;
}
.portal-image {
  height: auto;
  width: 30%;
  min-width: 20rem;

  @media screen and (max-width: 767px) {
    display: none;
  }
}
.logo-image {
  width: 8rem;
  height: 8rem;
  object-fit: contain;
  border: solid $lineColor1 1px;
}
</style>
