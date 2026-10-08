// Sets COOP/COEP on routes that need cross-origin isolation.
// Safari has no COEP: credentialless, so it gets require-corp instead
// (cross-origin subresources are then patched up by public/coi-sw.js).

import { needsIsolation, supportsCredentialless } from '../../utils/crossOriginIsolation'

export default defineEventHandler((event) => {
  if (!needsIsolation(getRequestURL(event).pathname)) return

  const userAgent = getRequestHeader(event, 'user-agent')
  setResponseHeaders(event, {
    'Cross-Origin-Opener-Policy': 'same-origin',
    'Cross-Origin-Embedder-Policy': supportsCredentialless(userAgent) ? 'credentialless' : 'require-corp',
    'Vary': 'User-Agent',
  })
})
