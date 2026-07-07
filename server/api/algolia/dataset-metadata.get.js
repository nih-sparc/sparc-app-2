import algoliasearch from 'algoliasearch'

export default defineCachedEventHandler(async (event) => {
  const id = getQuery(event).id
  if (!id) throw createError({ statusCode: 400, message: 'id is required' })
  const config = useRuntimeConfig()
  const client = algoliasearch(config.public.ALGOLIA_APP_ID, config.public.ALGOLIA_API_KEY)
  const index = client.initIndex(config.public.ALGOLIA_INDEX_PUBLISHED_TIME_DESC)
  return await index.getObject(id)
}, {
  maxAge: 30 * 60,
  name: 'algolia-dataset-metadata',
  getKey: (event) => `dataset-metadata-${getQuery(event).id}`
})
