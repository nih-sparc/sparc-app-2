// Server-side proxy for doi.org's content-negotiated citation metadata.
//
// doi.org redirects (often through citation.doi.org/api.crossref.org) to the
// publisher's own resolver, and that redirect hop can drop/alter headers
// (e.g. Accept, Origin) when followed by a browser's fetch(), which caused
// Safari specifically to receive a 406 from CrossRef's /transform endpoint
// and throw parsing a non-JSON body. Making this request server-side avoids
// that entirely, since it isn't a browser fetch subject to CORS/redirect
// quirks, and gives every browser the same result.
export default defineCachedEventHandler(async (event) => {
  const doi = getQuery(event).doi
  if (!doi) throw createError({ statusCode: 400, message: 'doi is required' })

  // doi.org expects the DOI's own "/" left intact in the path, so this isn't
  // re-encoded - the client is responsible for encoding it as a query value.
  const response = await fetch(`https://doi.org/${doi}`, {
    headers: { Accept: 'application/json' }
  })
  if (!response.ok) {
    throw createError({ statusCode: response.status, message: 'Failed to resolve DOI citation' })
  }
  return await response.json()
}, {
  maxAge: 24 * 60 * 60,
  name: 'doi-citation',
  getKey: (event) => `citation-${getQuery(event).doi}`
})
