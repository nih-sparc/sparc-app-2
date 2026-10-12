// Same-origin proxy for cross-origin subresources whose host sends no CORS headers.
// Used by public/coi-sw.js on cross-origin isolated pages in Safari (COEP: require-corp),
// where such subresources would otherwise be blocked.
// Only hosts in ALLOWED_HOSTS are proxied so this is not an open proxy.

// Hostnames only (compared against URL.hostname).
const ALLOWED_HOSTS = [
  'd0.awsstatic.com',
  // CFDE wheel in the footer (components/CfdeWheel) - its logos are hardcoded in the embed script
  'cfde-drc.s3.amazonaws.com',
  'cfde-drc.s3.us-east-2.amazonaws.com',
]

const PASSTHROUGH_HEADERS = ['content-type', 'content-length', 'cache-control', 'etag', 'last-modified']

export default defineEventHandler(async (event) => {
  const { url } = getQuery(event)

  let target
  try {
    target = new URL(url)
  } catch (e) {
    throw createError({ statusCode: 400, statusMessage: 'Invalid url' })
  }
  if (target.protocol !== 'https:' || !ALLOWED_HOSTS.includes(target.hostname)) {
    throw createError({ statusCode: 403, statusMessage: 'Host not allowed' })
  }

  const response = await fetch(target)
  const headers = new Headers()
  PASSTHROUGH_HEADERS.forEach((name) => {
    const value = response.headers.get(name)
    if (value) headers.set(name, value)
  })
  headers.set('Cross-Origin-Resource-Policy', 'same-origin')

  return new Response(response.body, {
    status: response.status,
    statusText: response.statusText,
    headers,
  })
})
