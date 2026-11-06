import algoliasearch from 'algoliasearch'
import { createNullCache } from '@algolia/cache-common'

export default defineNuxtPlugin((nuxtApp) => {
  const config = useRuntimeConfig()
  const client = algoliasearch(
    config.public.ALGOLIA_APP_ID,
    config.public.ALGOLIA_API_KEY,
    {
      // The browser build of algoliasearch caches responses in memory
      // indefinitely by default, which can serve stale results across
      // client-side navigations within the same session.
      responsesCache: createNullCache(),
      requestsCache: createNullCache(),
    }
  )

  return {
    provide: {
      algoliaClient: client,
    },
  }
})

