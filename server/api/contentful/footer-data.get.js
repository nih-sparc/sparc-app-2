import contentful from 'contentful'

export default defineCachedEventHandler(async () => {
  const config = useRuntimeConfig()
  const client = contentful.createClient({
    space: config.public.CTF_SPACE_ID,
    accessToken: config.public.CTF_CDA_ACCESS_TOKEN,
    host: config.public.CTF_API_HOST || 'preview.contentful.com'
  })
  const response = await client.getEntry(config.public.ctf_home_page_id)
  const { footerDescription, learnMoreLinks, policiesLinks, helpUsImproveLinks, stayUpdatedLinks } = response.fields
  return { footerDescription, learnMoreLinks, policiesLinks, helpUsImproveLinks, stayUpdatedLinks }
}, {
  maxAge: 60 * 60,
  name: 'contentful-footer-data',
  getKey: () => 'footer-data'
})
