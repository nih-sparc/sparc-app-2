import contentful from 'contentful'

export default defineCachedEventHandler(async () => {
  const config = useRuntimeConfig()
  const client = contentful.createClient({
    space: config.public.CTF_SPACE_ID,
    accessToken: config.public.CTF_CDA_ACCESS_TOKEN,
    host: config.public.CTF_API_HOST || 'preview.contentful.com'
  })
  const { items } = await client.getEntries({
    content_type: config.public.ctf_contact_us_form_type_id,
  })
  return items.map(item => ({ id: item.sys.id, label: item.fields.title, description: item.fields.description }))
}, {
  maxAge: 60 * 60,
  name: 'contentful-contact-us-form-types',
  getKey: () => 'contact-us-form-types'
})
