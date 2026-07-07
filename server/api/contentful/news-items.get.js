import contentful from 'contentful'
import { getQuery } from 'h3'

export default defineEventHandler(async (event) => {
  const { search, publishedLessThan, publishedGte, subjects, sortOrder, limit = 10, skip = 0 } = getQuery(event)
  const config = useRuntimeConfig()
  const client = contentful.createClient({
    space: config.public.CTF_SPACE_ID,
    accessToken: config.public.CTF_CDA_ACCESS_TOKEN,
    host: config.public.CTF_API_HOST || 'preview.contentful.com'
  })
  try {
    return await client.getEntries({
      content_type: 'news',
      order: sortOrder || '-fields.publishedDate',
      query: search || undefined,
      limit: parseInt(limit),
      skip: parseInt(skip),
      'fields.publishedDate[lt]': publishedLessThan || undefined,
      'fields.publishedDate[gte]': publishedGte || undefined,
      'fields.subject[in]': subjects || undefined
    })
  } catch (e) {
    console.error(e)
    return {}
  }
})
