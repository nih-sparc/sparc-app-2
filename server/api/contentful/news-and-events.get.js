import contentful from 'contentful'

export default defineCachedEventHandler(async () => {
  const config = useRuntimeConfig()
  const client = contentful.createClient({
    space: config.public.CTF_SPACE_ID,
    accessToken: config.public.CTF_CDA_ACCESS_TOKEN,
    host: config.public.CTF_API_HOST || 'preview.contentful.com'
  })
  const todaysDate = new Date()
  const [upcomingEvents, news, page, stories] = await Promise.all([
    client.getEntries({
      content_type: config.public.ctf_event_id,
      order: 'fields.startDate',
      'fields.startDate[gte]': todaysDate.toISOString(),
      limit: 2
    }),
    client.getEntries({
      content_type: config.public.ctf_news_id,
      order: '-fields.publishedDate',
      limit: 2
    }),
    client.getEntry(config.public.ctf_news_and_events_page_id),
    client.getEntries({
      content_type: 'communitySpotlight',
      order: '-fields.publishedDate',
      limit: 2,
      skip: 0
    })
  ])
  return { upcomingEvents, news, page, stories }
}, {
  maxAge: 60 * 60,
  name: 'contentful-news-and-events',
  getKey: () => 'news-and-events'
})
