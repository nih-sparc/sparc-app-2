import contentful from 'contentful'

export default defineCachedEventHandler(async () => {
  const config = useRuntimeConfig()
  const client = contentful.createClient({
    space: config.public.CTF_SPACE_ID,
    accessToken: config.public.CTF_CDA_ACCESS_TOKEN,
    host: config.public.CTF_API_HOST || 'preview.contentful.com'
  })
  const { items } = await client.getEntries({
    content_type: config.public.ctf_news_id,
    order: '-fields.publishedDate',
    limit: 999,
    'fields.subject': 'Highlight'
  })
  return items
}, {
  maxAge: 60 * 30,
  name: 'contentful-highlights',
  getKey: () => 'highlights'
})
