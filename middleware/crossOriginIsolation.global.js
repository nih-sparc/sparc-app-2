import { needsIsolation } from '~/utils/crossOriginIsolation'

// COOP/COEP only apply to a freshly loaded document, so force a full page load
// whenever navigation moves into or out of a cross-origin isolated route.
export default defineNuxtRouteMiddleware((to, from) => {
  if (import.meta.server || !from || to.path === from.path) return

  if (needsIsolation(to.path) !== window.crossOriginIsolated) {
    return navigateTo(to.fullPath, { external: true })
  }
})
