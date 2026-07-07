import contentful from 'contentful'

export default defineCachedEventHandler(async (event) => {
  const slug = getRouterParam(event, 'id')
  const config = useRuntimeConfig()
  const client = contentful.createClient({
    space: config.public.CTF_SPACE_ID,
    accessToken: config.public.CTF_CDA_ACCESS_TOKEN,
    host: config.public.CTF_API_HOST || 'preview.contentful.com'
  })
  const { items } = await client.getEntries({
    content_type: config.public.ctf_consortia_content_type_id,
    'fields.slug': slug.toLowerCase(),
  })
  return items[0] || null
}, {
  maxAge: 60 * 60,
  name: 'contentful-consortia-item',
  getKey: (event) => `consortia-item-${getRouterParam(event, 'id')}`
})
