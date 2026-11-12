// Server-side proxy for citation.doi.org's /format citation-rendering endpoint.
//
// CitationDetails.vue and DatasetFilesInfo.vue used to call this directly
// from the browser. It's the same CrossRef-backed service whose redirect
// handling differs across browsers (see server/api/citation.get.js), so this
// request is made server-side too, to get consistent results everywhere.
export default defineCachedEventHandler(async (event) => {
  const { doi, style, lang } = getQuery(event)
  if (!doi) throw createError({ statusCode: 400, message: 'doi is required' })

  const config = useRuntimeConfig()
  const url = `${config.public.crosscite_api_host}/format?doi=${encodeURIComponent(doi)}&style=${encodeURIComponent(style || 'apa')}&lang=${encodeURIComponent(lang || 'en-US')}`

  const response = await fetch(url)
  if (!response.ok) {
    throw createError({ statusCode: response.status, message: 'Failed to format DOI citation' })
  }
  setResponseHeader(event, 'Content-Type', 'text/plain; charset=utf-8')
  return await response.text()
}, {
  maxAge: 24 * 60 * 60,
  name: 'doi-citation-format',
  getKey: (event) => {
    const { doi, style, lang } = getQuery(event)
    return `citation-format-${doi}-${style || 'apa'}-${lang || 'en-US'}`
  }
})
