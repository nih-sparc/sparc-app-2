import contentful from 'contentful'

export default defineCachedEventHandler(async () => {
  const config = useRuntimeConfig()
  const client = contentful.createClient({
    space: config.public.CTF_SPACE_ID,
    accessToken: config.public.CTF_CDA_ACCESS_TOKEN,
    host: config.public.CTF_API_HOST || 'preview.contentful.com'
  })
  const contentType = await client.getContentType('communitySpotlight')
  let anatomicalStructures = {}
  contentType.fields.forEach(field => {
    if (field.id === 'anatomicalStructure') {
      const structures = field.items?.validations[0]['in']
      anatomicalStructures = {
        label: 'Focus',
        id: 'spotlightAnatomicalStructure',
        data: structures.map(itemLabel => ({ label: itemLabel, id: itemLabel }))
      }
    }
  })
  return anatomicalStructures
}, {
  maxAge: 60 * 60 * 6,
  name: 'contentful-community-spotlight-types',
  getKey: () => 'community-spotlight-types'
})
