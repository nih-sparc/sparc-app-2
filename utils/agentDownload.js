// Downloads too large for the browser go through the Pennsieve agent
// (pennsieve-agent 2.3.0+), which downloads published datasets through
// download-service (api2.<domain>/downloads) with the user's account.

import { CLIENT_NAME, publicDownloadsBase } from './publicDownloads.js'

export const AGENT_MIN_VERSION = '2.3.0'
export const AGENT_DOCS_URL = 'https://docs.pennsieve.io/docs/the-pennsieve-agent'

// A folder name that needs no quoting in any shell, short enough to type:
// dataset titles can be long.
export function agentFolderName(name, max = 40) {
  let safe = (name || '').replace(/[^A-Za-z0-9._-]+/g, '-').replace(/^[-.]+|-+$/g, '')
  if (safe.length > max) {
    const cut = safe.slice(0, max)
    const dash = cut.lastIndexOf('-')
    safe = (dash > max / 2 ? cut.slice(0, dash) : cut).replace(/[-.]+$/, '')
  }
  return safe || 'pennsieve-data'
}

// Quotes a path for POSIX shells only when it needs it.
export function shellQuote(s) {
  if (/^[A-Za-z0-9._\/:-]+$/.test(s)) return s
  return `'${s.replace(/'/g, `'\\''`)}'`
}

// How the AWS CLI reads a published dataset's bucket: the AWS Open Data
// buckets (…-aod-discover-…) are readable without an AWS account; the others
// are requester pays (the downloader's AWS account pays for the transfer), as
// the Files tab says.
export function awsAccess(uri) {
  const bucket = (uri || '').replace(/^s3:\/\//, '').split('/')[0]
  return bucket.includes('aod-discover') ? 'open-data' : 'requester-pays'
}

// AWS CLI commands that download a published dataset's latest version, or
// the selected items of it ({ path, isFolder }), into a new folder: one
// command per item. uri is the version's S3 location from discover-service.
export function awsCommands({ uri, items = [], folderName }) {
  if (!uri) return []
  const base = uri.endsWith('/') ? uri : `${uri}/`
  const flag = awsAccess(uri) === 'requester-pays' ? '--request-payer requester' : '--no-sign-request'
  const dest = `./${agentFolderName(folderName)}`
  if (items.length === 0) return [`aws s3 sync ${shellQuote(base)} ${dest} ${flag}`]
  return items.map(({ path, isFolder }) =>
    isFolder
      ? `aws s3 sync ${shellQuote(`${base}${path}/`)} ${shellQuote(`${dest}/${path}`)} ${flag}`
      : `aws s3 cp ${shellQuote(`${base}${path}`)} ${shellQuote(`${dest}/${path}`)} ${flag}`
  )
}

// The agent command that downloads a published version, or the paths of it,
// into a new folder. The version is always named, so the command downloads
// the same files later.
export function agentPublicCommand({ datasetId, version, paths = [], folderName }) {
  const parts = ['pennsieve', 'download', 'public', String(datasetId), `./${agentFolderName(folderName)}`]
  if (version) parts.push('--version', String(version))
  for (const p of paths) parts.push('--path', shellQuote(p))
  return parts.join(' ')
}

// The agent command that downloads a saved selection into a new folder:
// short however many files were selected.
export function agentSelectionCommand({ selectionId, folderName }) {
  return ['pennsieve', 'download', 'selection', selectionId, `./${agentFolderName(folderName)}`].join(' ')
}

// Where to save a selection: download-service on api2 with the user's token,
// or, without one, the anonymous public downloads API. Null when neither is
// available.
export function selectionEndpoint({ api2Host, publicHost, token }) {
  const base = publicDownloadsBase({ api2Host, publicHost, token })
  return base ? `${base}/selections` : null
}

// Saves a selection of a published version for two days, signed in or not.
// The id grants nothing: whoever downloads it is checked like any download,
// and the agent always signs in. Resolves to { id, expiresAt, count, size,
// version }.
export async function createPublicSelection({ url, token, datasetId, version, paths }, fetchFn = globalThis.fetch) {
  const headers = {
    'Content-Type': 'application/json',
    'X-Pennsieve-Client': CLIENT_NAME,
  }
  if (token) headers.Authorization = `Bearer ${token}`
  const resp = await fetchFn(url, {
    method: 'POST',
    headers,
    body: JSON.stringify({ datasetId: Number(datasetId), version: Number(version) || undefined, paths }),
  })
  const data = await resp.json().catch(() => ({}))
  if (!resp.ok) {
    throw new Error(data.message || `download-service responded ${resp.status}`)
  }
  return data
}
