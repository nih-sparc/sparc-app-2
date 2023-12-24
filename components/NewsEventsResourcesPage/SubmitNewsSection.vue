<template>
  <paper
    :text="parseMarkdown(searchPaperText)"
    :button-text="searchPaperNEButton"
    :button-link="{ name: 'contact-us', query: { type: 'news-event'} }"
    new-tab
  />
</template>

<script>
import Paper from '@/components/Paper/Paper.vue'
import marked from '@/mixins/marked/index'

export default {
  name: 'SubmitNewsSection',

  mixins: [marked],

  components: {
    Paper
  },

  data() {
    return {
      searchPaperText: '',
      searchPaperNEButton: ''
    }
  },

  async setup() {
    const config = useRuntimeConfig()
    const { $contentfulClient } = useNuxtApp()
    const response = await $contentfulClient.getEntry(config.public.ctf_news_and_events_page_id)
    this.searchPaperNEButton = response.fields.searchPaperNeButton
    this.searchPaperText = response.fields.searchPaperText
  }
}
</script>
