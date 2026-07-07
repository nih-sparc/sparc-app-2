import contentful from 'contentful'

export default defineCachedEventHandler(async () => {
  const config = useRuntimeConfig()
  const client = contentful.createClient({
    space: config.public.CTF_SPACE_ID,
    accessToken: config.public.CTF_CDA_ACCESS_TOKEN,
    host: config.public.CTF_API_HOST || 'preview.contentful.com'
  })
  let projectsAnatomicalFocusFacets = []
  let consortiaTypes = []
  const contentType = await client.getContentType('sparcAward')
  contentType.fields.forEach(field => {
    if (field.name === 'Funding') {
      consortiaTypes = (field.items?.validations[0]['in'] || []).map(label => ({ label, id: label }))
    }
    if (field.name === 'Focus') {
      projectsAnatomicalFocusFacets = (field.items?.validations[0]['in'] || []).map(label => ({ label, id: label }))
    }
  })
  return { projectsAnatomicalFocusFacets, consortiaTypes }
}, {
  maxAge: 60 * 60 * 6,
  name: 'contentful-sparc-award-types',
  getKey: () => 'sparc-award-types'
})
