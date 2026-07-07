import algoliasearch from 'algoliasearch'

export default defineCachedEventHandler(async () => {
  const config = useRuntimeConfig()
  const client = algoliasearch(config.public.ALGOLIA_APP_ID, config.public.ALGOLIA_API_KEY)
  const index = client.initIndex(config.public.ALGOLIA_INDEX_VERSION_PUBLISHED_TIME_DESC)
  const result = await index.search('', {
    hitsPerPage: 0,
    facets: ['item.modalities.keyword', 'anatomy.organ.category.name', 'organisms.primary.species.name', 'supportingAwards.consortium.name'],
  })
  return { facets: result.facets || {}, nbHits: result.nbHits || 0 }
}, {
  maxAge: 60 * 60,
  name: 'algolia-facets',
  getKey: () => 'facets'
})
