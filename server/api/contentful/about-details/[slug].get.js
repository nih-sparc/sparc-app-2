import contentful from 'contentful'

export default defineCachedEventHandler(async (event) => {
  const slug = getRouterParam(event, 'slug')
  const config = useRuntimeConfig()
  const client = contentful.createClient({
    space: config.public.CTF_SPACE_ID,
    accessToken: config.public.CTF_CDA_ACCESS_TOKEN,
    host: config.public.CTF_API_HOST || 'preview.contentful.com'
  })
  const entries = await client.getEntries({
    content_type: config.public.ctf_about_details_content_type_id,
    'fields.slug': slug
  })
  if (entries.items.length > 0) return { item: entries.items[0], foundBySlug: true }
  // Fallback: treat slug as a sys.id
  const entry = await client.getEntry(slug)
  return { item: entry, foundBySlug: false }
}, {
  maxAge: 60 * 60,
  name: 'contentful-about-details',
  getKey: (event) => `about-details-${getRouterParam(event, 'slug')}`
})
