<template>
  <Head>
    <Title>{{ title }}</Title>
    <Meta name="og:title" hid="og:title" :content="title" />
    <Meta name="twitter:title" :content="title" />
    <Meta name="description" hid="description" :content="summary" />
    <Meta name="og:description" hid="og:description" :content="summary" />
    <Meta name="twitter:description" :content="summary" />
  </Head>
  <div class="page-data pb-16">
    <breadcrumb :breadcrumb="breadcrumb" :title="title" />
    <page-hero class="py-24">
      <h1>{{ title }}</h1>
      <p>{{ summary }}</p>
    </page-hero>
    <div class="container">
      <div class="subpage px-32 py-16">
        <div v-html="parseMarkdown(description)" />
        <div v-for="callToAction in callsToAction" :key="callToAction.sys.id" class="mb-16">
          <a v-if="callToAction.fields" :href="callToAction.fields.url" @click="callToAction.fields.url == null && $emit('click')">
            <el-button>{{ callToAction.fields.title }}</el-button>
          </a>
        </div>
      </div>
      <div v-if="learnMore" class="subpage px-32 mb-0">
        <div class="heading2 mb-16">Learn More</div>
        <div v-for="(item, i) in learnMore" :key="item.sys.id">
          <learn-more-card :about-details-item="item" :parent-path="slug" />
          <hr v-if="i < learnMore.length - 1" />
        </div>
      </div>
    </div>
    <login-modal :show-dialog="showLoginDialog" redirectUrl="/user/profile" @dialog-closed="showLoginDialog = false" />
  </div>
</template>

<script>
import LearnMoreCard from '@/components/LearnMoreCard/LearnMoreCard.vue'
import MarkedMixin from '@/mixins/marked'
import LoginModal from '@/components/LoginModal/LoginModal.vue'

export default {
  name: 'ShareDataPage',
  components: {
    LearnMoreCard,
    LoginModal
  },
  mixins: [MarkedMixin],

  async setup() {
    const { $contentfulClient } = useNuxtApp()
    const config = useRuntimeConfig()
    const pageData = await $contentfulClient.getEntry(config.public.ctf_share_data_page_id)
    return {
      title: pageData.fields.title,
      summary: pageData.fields.summary,
      description: pageData.fields.description,
      learnMore: pageData.fields.learnMore,
      callsToAction: pageData.fields.callsToAction,
      slug: pageData.fields.slug
    }
  },

  data: () => {
    return {
      breadcrumb: [
        {
          to: {
            name: 'index'
          },
          label: 'Home'
        }
      ],
      showLoginDialog: false
    }
  }
}
</script>

<style scoped lang="scss">
@import 'sparc-design-system-components-2/src/assets/_variables.scss';
.page-data {
  background-color: $background;
}
hr {
  border-top: none;
}
:deep(img) {
  max-width: 100%;
}
</style>
