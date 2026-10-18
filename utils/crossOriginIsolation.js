// Routes that need cross-origin isolation (SharedArrayBuffer) for the
// threaded libOpenCOR WASM used by SimulationVuer (also bundled in
// MapIntegratedVuer). File pages are only isolated for simulation (.omex)
// files, so other file viewers are not affected by COEP.
// Keep in sync with the copy in public/coi-sw.js.
export const ISOLATED_ROUTES = [
  { path: /^\/apps\/maps\/?$/ },
  { path: /^\/datasets\/file\//, filePath: /\.omex$/i },
  { path: /^\/datasets\/simulationviewer\/?$/ },
]

// `url` is a path with an optional query string, or a URL / Location object.
export const needsIsolation = (url) => {
  const { pathname, searchParams } = new URL(url, 'http://localhost')
  return ISOLATED_ROUTES.some((route) =>
    route.path.test(pathname) &&
    (!route.filePath || route.filePath.test(searchParams.get('path') || ''))
  )
}

// Chromium and Firefox (non-iOS) support COEP: credentialless. Everything else,
// i.e. Safari and all iOS browsers (WebKit), needs require-corp.
export const supportsCredentialless = (userAgent = '') => /(Chrome|Chromium|Firefox)\/\d/.test(userAgent)
