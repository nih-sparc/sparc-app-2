import { needsIsolation, supportsCredentialless } from '~/utils/crossOriginIsolation'

const SW_URL = '/coi-sw.js'
const RELOAD_FLAG = 'coiServiceWorkerReloaded'

// Safari (require-corp) needs public/coi-sw.js to let cross-origin subresources
// load on isolated pages. It is registered on every page so it is usually in
// control before the user reaches an isolated route.
const setUpServiceWorker = async () => {
  if (supportsCredentialless(navigator.userAgent)) {
    // Not needed with credentialless - remove any stale registration.
    const registrations = await navigator.serviceWorker.getRegistrations()
    registrations
      .filter((registration) => registration.active?.scriptURL.endsWith(SW_URL))
      .forEach((registration) => registration.unregister())
    return
  }

  try {
    await navigator.serviceWorker.register(SW_URL, { scope: '/' })
    await navigator.serviceWorker.ready
  } catch (e) {
    console.error('Failed to register cross-origin isolation service worker', e)
    return
  }

  // First visit lands directly on an isolated page: subresources already loaded
  // without the worker, so reload once now that it is in control.
  if (needsIsolation(window.location.pathname) && !navigator.serviceWorker.controller) {
    let reloaded = false
    try {
      reloaded = sessionStorage.getItem(RELOAD_FLAG) === 'true'
      sessionStorage.setItem(RELOAD_FLAG, 'true')
    } catch (e) {
      // sessionStorage unavailable - skip the reload rather than risk a loop.
      reloaded = true
    }
    if (!reloaded) {
      window.location.reload()
    }
  }
}

export default defineNuxtPlugin(() => {
  if (!('serviceWorker' in navigator)) return
  // Not awaited so it doesn't hold up app start-up.
  setUpServiceWorker()
})
