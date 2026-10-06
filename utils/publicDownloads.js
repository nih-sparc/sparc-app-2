// Downloads of published datasets through download-service
// (download-service docs/public-downloads.md): links to single files, and
// zip archives built for one request. Signed in, the routes are on api2 with
// the user's token; anonymously, on the public downloads API
// (download_public_host, e.g. https://downloads.pennsieve.io).

// Where the public routes are: api2's /downloads/public with a token, the
// public downloads API without. Without download_public_host, the anonymous
// API is assumed to sit beside api2 (api2.<domain> → downloads.<domain>).
export function publicDownloadsBase({ api2Host, publicHost, token }) {
  const api2 = (api2Host || '').replace(/\/+$/, '')
  if (token) return `${api2}/downloads/public`
  const host = (publicHost || '').replace(/\/+$/, '') || api2.replace('//api2.', '//downloads.')
  return host && host !== api2 ? `${host}/public` : null
}

// Who's asking, for download-service's metrics.
export const CLIENT_NAME = 'sparc-portal'

export class PublicDownloadError extends Error {
  constructor(status, message) {
    super(message)
    this.status = status
  }
}

async function call(base, token, method, path, body, fetchFn) {
  if (!base) throw new PublicDownloadError(0, 'Downloads are not available here.')
  const headers = { 'X-Pennsieve-Client': CLIENT_NAME }
  if (body !== undefined) headers['Content-Type'] = 'application/json'
  if (token) headers.Authorization = `Bearer ${token}`
  const resp = await fetchFn(`${base}${path}`, {
    method,
    headers,
    body: body === undefined ? undefined : JSON.stringify(body),
  })
  if (resp.status === 204) return null
  const data = await resp.json().catch(() => ({}))
  if (!resp.ok) {
    throw new PublicDownloadError(resp.status, data.message || `download-service responded ${resp.status}`)
  }
  return data
}

// A link to one file of a version: { url, expiresAt, fileName, size }.
// purpose "view" opens it in the browser (a viewer, a preview) and is
// recorded as a view, not a download.
export function publicFileUrl({ base, token, datasetId, version, path, purpose }, fetchFn = globalThis.fetch) {
  const body = { datasetId: Number(datasetId), version: Number(version) || undefined, paths: [path] }
  if (purpose) body.purpose = purpose
  return call(base, token, 'POST', '/files/url', body, fetchFn)
}

// Starts an archive of paths of a version ([""] or none is all of it). The
// archive record: { id, status, archiveName, fileCount, totalBytes, ... }.
export function createPublicArchive({ base, token, datasetId, version, paths, rootPath, archiveName }, fetchFn = globalThis.fetch) {
  const body = { datasetId: Number(datasetId), version: Number(version) || undefined }
  if (paths && paths.length) body.paths = paths
  if (rootPath) body.rootPath = rootPath
  if (archiveName) body.archiveName = archiveName
  return call(base, token, 'POST', '/archives', body, fetchFn)
}

export function getPublicArchive({ base, token, id }, fetchFn = globalThis.fetch) {
  return call(base, token, 'GET', `/archives/${encodeURIComponent(id)}`, undefined, fetchFn)
}

export function publicArchiveUrl({ base, token, id }, fetchFn = globalThis.fetch) {
  return call(base, token, 'GET', `/archives/${encodeURIComponent(id)}/url`, undefined, fetchFn)
}

export function deletePublicArchive({ base, token, id }, fetchFn = globalThis.fetch) {
  return call(base, token, 'DELETE', `/archives/${encodeURIComponent(id)}`, undefined, fetchFn)
}

// A published file's path in its version: its path, or the part of its S3
// URI (s3://bucket/<datasetId>/<path>) after the dataset id.
export function filePathOf(file) {
  if (file?.path) return file.path
  const match = (file?.uri || '').match(/^s3:\/\/[^/]+\/[0-9]+\/(.+)$/)
  return match ? match[1] : ''
}

// The dataset id in a published file's S3 URI.
export function datasetIdOf(file) {
  const match = (file?.uri || '').match(/^s3:\/\/[^/]+\/([0-9]+)\//)
  return match ? match[1] : ''
}

export const isActive = (archive) => archive?.status === 'QUEUED' || archive?.status === 'RUNNING'

// Opens a download link: the browser saves it (the link says attachment).
export function startBrowserDownload(url) {
  const link = document.createElement('a')
  link.href = url
  link.rel = 'noopener'
  document.body.appendChild(link)
  link.click()
  document.body.removeChild(link)
}

// Archives this browser asked for, so a visitor can come back to one: an
// anonymous archive's id is the only way to reach it. Kept in localStorage,
// never a cookie, so the id isn't sent anywhere. Entries:
// { id, datasetId, version, signedIn, whole, archiveName, expiresAt }, whole
// for an archive of the whole version.
const STORAGE_KEY = 'sparc-portal.archives'

function readArchives(storage, now) {
  try {
    const all = JSON.parse(storage.getItem(STORAGE_KEY) || '[]')
    return Array.isArray(all) ? all.filter((a) => a && a.id && Date.parse(a.expiresAt) > now) : []
  } catch (e) {
    return []
  }
}

function writeArchives(storage, archives) {
  try {
    storage.setItem(STORAGE_KEY, JSON.stringify(archives))
  } catch (e) {
    // Private windows may refuse: the archive still works for this visit.
  }
}

export function rememberArchive(entry, storage = globalThis.localStorage, now = Date.now()) {
  if (!storage) return
  const rest = readArchives(storage, now).filter((a) => a.id !== entry.id)
  writeArchives(storage, [...rest, entry].slice(-20))
}

export function forgetArchive(id, storage = globalThis.localStorage, now = Date.now()) {
  if (!storage) return
  writeArchives(storage, readArchives(storage, now).filter((a) => a.id !== id))
}

// The remembered archives of one dataset version, newest last.
export function rememberedArchives({ datasetId, version }, storage = globalThis.localStorage, now = Date.now()) {
  if (!storage) return []
  return readArchives(storage, now).filter(
    (a) => String(a.datasetId) === String(datasetId) && String(a.version) === String(version)
  )
}
