import contentful from 'contentful'
import { propOr } from 'ramda'

export default defineCachedEventHandler(async () => {
  const config = useRuntimeConfig()
  const client = contentful.createClient({
    space: config.public.CTF_SPACE_ID,
    accessToken: config.public.CTF_CDA_ACCESS_TOKEN,
    host: config.public.CTF_API_HOST || 'preview.contentful.com'
  })
  const response = await client.getEntry(config.public.ctf_contact_us_form_options_id)
  const fields = response.fields
  return {
    userTypes: propOr([], 'typeOfUser', fields),
    areasOfSparc: propOr([], 'areaOfSparcPortal', fields),
    services: propOr([], 'services', fields),
    resourceCategories: propOr([], 'resourceCategories', fields),
  }
}, {
  maxAge: 60 * 60,
  name: 'contentful-form-options',
  getKey: () => 'form-options'
})
