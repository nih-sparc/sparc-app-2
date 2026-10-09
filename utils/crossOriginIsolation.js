// Routes that need cross-origin isolation (SharedArrayBuffer) for the
// threaded WASM used by SimulationVuer / MapIntegratedVuer.
// Keep in sync with the copy in public/coi-sw.js.
export const ISOLATED_ROUTES = [
  /^\/apps\/maps\/?$/,
  /^\/datasets\/file\//,
  /^\/datasets\/simulationviewer\/?$/,
]

export const needsIsolation = (path) => ISOLATED_ROUTES.some((re) => re.test(path))

// Chromium and Firefox (non-iOS) support COEP: credentialless. Everything else,
// i.e. Safari and all iOS browsers (WebKit), needs require-corp.
export const supportsCredentialless = (userAgent = '') => /(Chrome|Chromium|Firefox)\/\d/.test(userAgent)
