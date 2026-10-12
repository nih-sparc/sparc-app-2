// Safari-only service worker (registered by plugins/coiServiceWorker.client.js).
// Safari has no COEP: credentialless, so isolated pages use require-corp, which
// blocks cross-origin no-cors subresources without a CORP header. For pages on
// isolated routes, re-request those subresources in CORS mode and add
// Cross-Origin-Resource-Policy so they pass (works for any host sending CORS
// headers, e.g. Contentful images).

// Copy of ISOLATED_ROUTES in utils/crossOriginIsolation.js - a service worker
// cannot import app modules, so keep the two in sync.
const ISOLATED_ROUTES = [
  { path: /^\/apps\/maps\/?$/ },
  { path: /^\/datasets\/file\//, filePath: /\.omex$/i },
  { path: /^\/datasets\/simulationviewer\/?$/ },
]

// Same-origin proxy for allowlisted hosts without CORS (server/api/coi-proxy.get.js).
const PROXY_URL = '/api/coi-proxy'

const REWRITE_DESTINATIONS = ['image', 'script', 'style']

self.addEventListener('install', () => self.skipWaiting())
self.addEventListener('activate', (event) => event.waitUntil(self.clients.claim()))

const isFromIsolatedPage = async (clientId) => {
  if (!clientId) return false
  const client = await self.clients.get(clientId)
  if (!client) return false
  const { pathname, searchParams } = new URL(client.url)
  return ISOLATED_ROUTES.some((route) =>
    route.path.test(pathname) &&
    (!route.filePath || route.filePath.test(searchParams.get('path') || ''))
  )
}

const fetchWithCorp = async (request, clientId) => {
  if (await isFromIsolatedPage(clientId)) {
    try {
      const response = await fetch(new Request(request.url, { mode: 'cors', credentials: 'omit' }))
      const headers = new Headers(response.headers)
      headers.set('Cross-Origin-Resource-Policy', 'cross-origin')
      return new Response(response.body, {
        status: response.status,
        statusText: response.statusText,
        headers,
      })
    } catch (e) {
      // Host does not support CORS - try the same-origin proxy,
      // which only serves allowlisted hosts (server/api/coi-proxy.get.js).
      const proxied = await fetch(`${PROXY_URL}?url=${encodeURIComponent(request.url)}`).catch(() => null)
      if (proxied?.ok) return proxied
    }
  }
  return fetch(request)
}

self.addEventListener('fetch', (event) => {
  const { request } = event
  if (
    request.mode !== 'no-cors' ||
    !REWRITE_DESTINATIONS.includes(request.destination) ||
    new URL(request.url).origin === self.location.origin
  ) {
    return
  }
  event.respondWith(fetchWithCorp(request, event.clientId))
})
