import algoliasearch from 'algoliasearch'

export default defineCachedEventHandler(async () => {
  const config = useRuntimeConfig()
  const client = algoliasearch(config.public.ALGOLIA_APP_ID, config.public.ALGOLIA_API_KEY)
  const index = client.initIndex(config.public.ALGOLIA_INDEX_PUBLISHED_TIME_DESC)
  const { facets } = await index.search('', {
    hitsPerPage: 0,
    sortFacetValuesBy: 'alpha',
    facets: 'pennsieve.organization.identifier',
  })
  return Object.keys(facets?.['pennsieve.organization.identifier'] || {})
}, {
  maxAge: 60 * 60,
  name: 'algolia-organization-ids',
  getKey: () => 'organization-ids'
})
