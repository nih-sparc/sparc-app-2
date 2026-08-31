// Drop-in replacement for @zadigetvoltaire/nuxt-gtm (unmaintained, Nuxt 3 only).
// Faithfully reproduces the subset of @gtm-support/vue-gtm's behavior this app
// actually relies on: `this.$gtm.trackEvent(...)`, `this.$gtm.push(...)`, and
// route-change view tracking (`enableRouterSync`). Field remapping in
// trackEvent (category -> target, label -> target-properties, etc.) matches
// @gtm-support/core exactly so dataLayer payloads are unchanged.
export default defineNuxtPlugin((nuxtApp) => {
  const config = useRuntimeConfig().public.gtm
  const router = useRouter()

  const state = {
    enabled: config.enabled ?? true,
    debug: config.debug ?? false,
  }

  function hasScript(source) {
    return Array.from(document.getElementsByTagName('script')).some((s) => s.src.includes(source))
  }

  function loadScript() {
    const source = config.source || 'https://www.googletagmanager.com/gtm.js'
    if (!config.id || hasScript(source)) return

    window.dataLayer = window.dataLayer || []
    window.dataLayer.push({ event: 'gtm.js', 'gtm.start': new Date().getTime() })

    const script = document.createElement('script')
    script.async = !config.defer
    script.defer = !!(config.defer || config.compatibility)
    const params = new URLSearchParams({ id: config.id, ...(config.queryParams || {}) })
    script.src = `${source}?${params}`
    document.body.appendChild(script)
  }

  function dataLayer() {
    return state.enabled ? (window.dataLayer = window.dataLayer || []) : false
  }

  function trackView(screenName, path, extra = {}) {
    if (state.debug) console.log(`[GTM-Support${state.enabled ? '' : '(disabled)'}]: Dispatching TrackView`, { screenName, path })
    if (state.enabled) dataLayer().push({ ...extra, event: 'content-view', 'content-name': path, 'content-view-name': screenName })
  }

  function trackEvent({ event, category = null, action = null, label = null, value = null, noninteraction = false, ...rest } = {}) {
    if (state.debug) console.log(`[GTM-Support${state.enabled ? '' : '(disabled)'}]: Dispatching event`, { event, category, action, label, value, ...rest })
    if (state.enabled) {
      dataLayer().push({
        event: event ?? 'interaction',
        target: category,
        action,
        'target-properties': label,
        value,
        'interaction-type': noninteraction,
        ...rest,
      })
    }
  }

  function push(obj) {
    if (state.debug) console.log(`[GTM-Support${state.enabled ? '' : '(disabled)'}]: Dispatching event`, obj)
    if (state.enabled) dataLayer().push(obj)
  }

  const gtm = {
    enabled: () => state.enabled,
    enable(value = true) {
      state.enabled = value
      if (value && (config.loadScript ?? true)) loadScript()
    },
    debugEnabled: () => state.debug,
    debug: (value) => { state.debug = value },
    dataLayer,
    trackView,
    trackEvent,
    push,
  }

  nuxtApp.vueApp.config.globalProperties.$gtm = gtm
  nuxtApp.provide('gtm', gtm)

  if (config.enableRouterSync && router) {
    router.afterEach((to) => {
      if (typeof to.name !== 'string') return
      const screenName = (to.meta && typeof to.meta.gtm === 'string' && to.meta.gtm) || to.name
      const additionalData = { ...(to.meta?.gtmAdditionalEventData || {}) }
      if (config.trackOnNextTick) {
        nextTick(() => trackView(screenName, to.fullPath, additionalData))
      } else {
        trackView(screenName, to.fullPath, additionalData)
      }
    })
  }

  if (state.enabled && (config.loadScript ?? true)) {
    loadScript()
  }
})
