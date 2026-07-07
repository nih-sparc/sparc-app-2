import contentful from 'contentful'

export default defineCachedEventHandler(async (event) => {
  const id = getRouterParam(event, 'id')
  const config = useRuntimeConfig()
  const client = contentful.createClient({
    space: config.public.CTF_SPACE_ID,
    accessToken: config.public.CTF_CDA_ACCESS_TOKEN,
    host: config.public.CTF_API_HOST || 'preview.contentful.com'
  })
  return await client.getEntry(id)
}, {
  maxAge: 60 * 60,
  name: 'contentful-entry',
  getKey: (event) => `entry-${getRouterParam(event, 'id')}`
})
