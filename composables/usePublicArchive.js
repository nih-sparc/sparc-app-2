import { onBeforeUnmount, ref } from 'vue'
import useGetToken from '@/composables/useGetToken'
import {
  createPublicArchive,
  deletePublicArchive,
  forgetArchive,
  getPublicArchive,
  isActive,
  publicArchiveUrl,
  publicDownloadsBase,
  rememberArchive,
  startBrowserDownload,
} from '@/utils/publicDownloads'

const POLL_MS = 3000

// Messages from download-service are lower-case phrases.
function sentence(message) {
  const m = (message || 'Something went wrong. Try again.').trim()
  return m.charAt(0).toUpperCase() + m.slice(1) + (/[.!?]$/.test(m) ? '' : '.')
}

/**
 * One zip archive of a published dataset (or files of it), built by
 * download-service: start it, follow its progress, and download it when it's
 * ready. Archives are remembered in this browser, so a visitor can come back
 * to one (an anonymous archive's id is the only way to reach it).
 */
export function usePublicArchive() {
  const runtimeConfig = useRuntimeConfig()
  const archive = ref(null)
  const error = ref('')
  const starting = ref(false)
  const signedIn = ref(false)
  let timer = null
  // Download once when an archive started here becomes ready.
  let downloadWhenReady = false

  // A signed-in archive is reached on api2 with the token, an anonymous one
  // on the public API without it.
  async function endpoint(asSignedIn) {
    const token = asSignedIn ? (await useGetToken()) || '' : ''
    return {
      token,
      base: publicDownloadsBase({
        api2Host: runtimeConfig.public.api2_host,
        publicHost: runtimeConfig.public.download_public_host,
        token,
      }),
    }
  }

  function stop() {
    clearTimeout(timer)
    timer = null
  }

  async function start({ datasetId, version, paths, rootPath, archiveName }) {
    stop()
    error.value = ''
    starting.value = true
    try {
      signedIn.value = Boolean(await useGetToken())
      const { base, token } = await endpoint(signedIn.value)
      const created = await createPublicArchive({ base, token, datasetId, version, paths, rootPath, archiveName })
      archive.value = created
      rememberArchive({
        id: created.id,
        datasetId: Number(datasetId),
        version: created.publicVersion || version,
        signedIn: signedIn.value,
        whole: !paths || paths.every((p) => p === ''),
        archiveName: created.archiveName,
        expiresAt: created.expiresAt,
      })
      downloadWhenReady = true
      schedule()
    } catch (e) {
      error.value = sentence(e.message)
    } finally {
      starting.value = false
    }
  }

  // Follows an archive this browser started earlier: { id, signedIn }.
  async function resume(entry) {
    stop()
    error.value = ''
    signedIn.value = Boolean(entry.signedIn)
    downloadWhenReady = false
    if (signedIn.value && !(await useGetToken())) {
      archive.value = null
      return
    }
    archive.value = { id: entry.id, status: 'QUEUED', archiveName: entry.archiveName }
    await refresh()
  }

  async function refresh() {
    const current = archive.value
    if (!current) return
    try {
      const { base, token } = await endpoint(signedIn.value)
      const latest = await getPublicArchive({ base, token, id: current.id })
      if (archive.value?.id !== current.id) return
      archive.value = latest
      if (isActive(latest)) {
        schedule()
      } else if (latest.status === 'READY' && downloadWhenReady) {
        downloadWhenReady = false
        await download()
      }
    } catch (e) {
      if (e.status === 404) {
        // Expired, deleted, or another browser's session.
        forgetArchive(current.id)
        archive.value = null
        return
      }
      error.value = sentence(e.message)
      schedule()
    }
  }

  function schedule() {
    stop()
    timer = setTimeout(refresh, POLL_MS)
  }

  async function download() {
    if (!archive.value) return
    error.value = ''
    try {
      const { base, token } = await endpoint(signedIn.value)
      const { url } = await publicArchiveUrl({ base, token, id: archive.value.id })
      startBrowserDownload(url)
    } catch (e) {
      error.value = sentence(e.message)
    }
  }

  // Cancels a build, or deletes a built archive.
  async function remove() {
    const current = archive.value
    if (!current) return
    stop()
    try {
      const { base, token } = await endpoint(signedIn.value)
      await deletePublicArchive({ base, token, id: current.id })
    } catch (e) {
      if (e.status !== 404) {
        error.value = sentence(e.message)
        return
      }
    }
    forgetArchive(current.id)
    archive.value = null
    error.value = ''
  }

  onBeforeUnmount(stop)

  return { archive, error, starting, signedIn, start, resume, download, remove }
}
