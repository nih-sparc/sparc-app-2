import contentful from 'contentful'

export default defineCachedEventHandler(async () => {
  const config = useRuntimeConfig()
  const client = contentful.createClient({
    space: config.public.CTF_SPACE_ID,
    accessToken: config.public.CTF_CDA_ACCESS_TOKEN,
    host: config.public.CTF_API_HOST || 'preview.contentful.com'
  })
  const contentType = await client.getContentType('featuredData')
  let categories = []
  contentType.fields.forEach(field => {
    if (field.id === 'facetType') {
      categories = field.items?.validations[0]['in']
    }
  })
  return categories
}, {
  maxAge: 60 * 60 * 6,
  name: 'contentful-featured-data-categories',
  getKey: () => 'featured-data-categories'
})
