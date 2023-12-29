<template>
  <paper
    :text="parseMarkdown(searchPaperText)"
    :button-text="searchPaperButton"
    :button-link="{ name: 'contact-us', query: { type: 'tool'} }"
    new-tab
  />
</template>

<script>
import Paper from '@/components/Paper/Paper.vue'
import marked from '@/mixins/marked/index'

export default {
  name: 'SubmitToolSection',

  mixins: [marked],

  components: {
    Paper
  },

  async setup() {
    const { $contentfulClient } = useNuxtApp()
    const config = useRuntimeConfig()
    const response = await $contentfulClient.getEntry(config.public.ctf_tools_and_resources_page_id)
    const searchPaperButton = response.fields.searchPaperButton
    const searchPaperText = response.fields.searchPaperText
    return {
      searchPaperText,
      searchPaperButton
    }
  }
}
</script>
