import useGetToken from '@/composables/useGetToken'
import { publicDownloadsBase, publicFileUrl, startBrowserDownload } from '@/utils/publicDownloads'

/**
 * A download-service link to one file of a published version, as the
 * signed-in visitor if there is one: { url, expiresAt, fileName, size }.
 * purpose "view" is for viewers and previews (recorded as a view, not a
 * download); without it, the link downloads the file. Pass config where
 * useRuntimeConfig can't be called (after an await in setup on the server).
 */
export async function usePublicFileLink({ datasetId, version, path, purpose }, config = useRuntimeConfig()) {
  const token = (await useGetToken()) || ''
  const base = publicDownloadsBase({
    api2Host: config.public.api2_host,
    publicHost: config.public.download_public_host,
    token,
  })
  return publicFileUrl({ base, token, datasetId, version, path, purpose })
}

// Downloads one file of a published version through a link.
export async function downloadPublicFile({ datasetId, version, path }) {
  const { url } = await usePublicFileLink({ datasetId, version, path })
  startBrowserDownload(url)
}
