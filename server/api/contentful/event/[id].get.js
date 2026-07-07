import contentful from 'contentful'

export default defineCachedEventHandler(async (event) => {
  const id = getRouterParam(event, 'id')
  const config = useRuntimeConfig()
  const client = contentful.createClient({
    space: config.public.CTF_SPACE_ID,
    accessToken: config.public.CTF_CDA_ACCESS_TOKEN,
    host: config.public.CTF_API_HOST || 'preview.contentful.com'
  })
  const isSlug = id.split('-').length > 1
  if (isSlug) {
    const { items } = await client.getEntries({
      content_type: config.public.ctf_event_id,
      'fields.slug': id
    })
    return items[0] || null
  }
  return await client.getEntry(id)
}, {
  maxAge: 60 * 60,
  name: 'contentful-event',
  getKey: (event) => `event-${getRouterParam(event, 'id')}`
})
