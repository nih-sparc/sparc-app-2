<template>
  <Paper
    :text="parseMarkdown(searchPaperText)"
    :button-text="searchPaperNEButton"
    :button-link="{ name: 'contact-us', query: { type: 'news-event'} }"
    new-tab
  />
</template>

<script setup>
import { useNuxtApp, useRuntimeConfig } from '#imports';
import Paper from '@/components/Paper/Paper.vue';
import { marked } from 'marked'
import DOMPurify from 'isomorphic-dompurify'

// Setup
const config = useRuntimeConfig();
const { $contentfulClient } = useNuxtApp();

// Fetch data
const { data } = await useAsyncData('newsAndEventsPage', async () => {
  const pageData = await $contentfulClient.getEntry(config.public.ctf_news_and_events_page_id);
  return {
    fields: pageData.fields || {},
  }
});

const searchPaperNEButton = computed(() => data.value?.fields.searchPaperNeButton || '')
const searchPaperText = computed(() => data.value?.fields.searchPaperText || '')
// Markdown parser with sanitization
const parseMarkdown = (markdown = '', purifyOptions = {}) => {
  purifyOptions = { ...purifyOptions, ADD_ATTR: ['target'] }
  return DOMPurify.sanitize(marked(markdown), purifyOptions)
}

</script>
