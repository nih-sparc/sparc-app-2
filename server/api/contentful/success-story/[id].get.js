import contentful from 'contentful'

export default defineCachedEventHandler(async (event) => {
  const id = getRouterParam(event, 'id')
  const config = useRuntimeConfig()
  const client = contentful.createClient({
    space: config.public.CTF_SPACE_ID,
    accessToken: config.public.CTF_CDA_ACCESS_TOKEN,
    host: config.public.CTF_API_HOST || 'preview.contentful.com'
  })
  const { items } = await client.getEntries({
    content_type: 'successStoryDisplay',
    'fields.storyRoute[match]': id,
    include: 1,
    order: '-fields.publishedDate',
  })
  return items[0]?.fields || {}
}, {
  maxAge: 60 * 60,
  name: 'contentful-success-story',
  getKey: (event) => `success-story-${getRouterParam(event, 'id')}`
})
