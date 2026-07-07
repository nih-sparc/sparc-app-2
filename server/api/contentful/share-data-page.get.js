import contentful from 'contentful'

export default defineCachedEventHandler(async () => {
  const config = useRuntimeConfig()
  const client = contentful.createClient({
    space: config.public.CTF_SPACE_ID,
    accessToken: config.public.CTF_CDA_ACCESS_TOKEN,
    host: config.public.CTF_API_HOST || 'preview.contentful.com'
  })
  const entry = await client.getEntry(config.public.ctf_share_data_page_id)
  return entry.fields
}, {
  maxAge: 60 * 60,
  name: 'contentful-share-data-page',
  getKey: () => 'share-data-page'
})
