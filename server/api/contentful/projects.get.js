import contentful from 'contentful'

export default defineCachedEventHandler(async () => {
  const config = useRuntimeConfig()
  const client = contentful.createClient({
    space: config.public.CTF_SPACE_ID,
    accessToken: config.public.CTF_CDA_ACCESS_TOKEN,
    host: config.public.CTF_API_HOST || 'preview.contentful.com'
  })
  const { items } = await client.getEntries({
    content_type: config.public.ctf_project_id,
  })
  return items
}, {
  maxAge: 60 * 60,
  name: 'contentful-projects',
  getKey: () => 'projects'
})
