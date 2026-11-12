export const NEUROGLANCER_ASSET_TYPES = ['ome-zarr', 'neuroglancer-precomputed']

export const THUMBNAIL_ASSET_TYPE = 'thumb'
const THUMBNAIL_FILE_NAME = 'thumbnail.png'

/**
 * Signed URL for a thumb asset's image. Uses the response's CloudFront values as query
 * params rather than its Set-Cookie headers, which are scoped to the Pennsieve domain.
 */
export const thumbnailUrl = (asset, cloudfront) => {
  if (!asset?.asset_url) return undefined
  const url = `${asset.asset_url}${THUMBNAIL_FILE_NAME}`
  if (!cloudfront?.policy || !cloudfront?.signature || !cloudfront?.key_pair_id) return url
  const params = new URLSearchParams({
    Policy: cloudfront.policy,
    Signature: cloudfront.signature,
    'Key-Pair-Id': cloudfront.key_pair_id,
  })
  return `${url}?${params.toString()}`
}

export const useViewerAssets = () => {
  const { $axios } = useNuxtApp()
  const config = useRuntimeConfig()

  async function fetchViewerAssets(packageId) {
    if (!packageId) {
      return { assets: [], cloudfront: null }
    }

    const url = `${config.public.PENNSIEVE_DISCOVER_API_HOST_V2}/packages/discover/assets?package_id=${encodeURIComponent(packageId)}`

    try {
      const { data } = await $axios.get(url)
      const cloudfront = data?.cloudfront || null

      const seen = new Set()
      const assets = (data?.assets || [])
        .filter((a) => {
          if (!NEUROGLANCER_ASSET_TYPES.includes(a.asset_type)) return false
          if (a.status !== 'ready') return false
          if (seen.has(a.asset_url)) return false
          seen.add(a.asset_url)
          return true
        })
        .map((a) => ({ ...a, cloudfront }))

      return { assets, cloudfront }
    } catch (error) {
      // 404 means the package has no viewer assets — expected case, not an error.
      if (error?.response?.status !== 404) {
        console.error('Error fetching viewer assets:', error)
      }
      return { assets: [], cloudfront: null }
    }
  }

  /**
   * Processed images of a published dataset, newest first: one entry per package with a
   * ready thumbnail, as `{ packageId, thumbnailUrl, zarrAsset }`. `zarrAsset` (or null) is
   * the package's ome-zarr for the viewer, with `cloudfront` attached; prefers a zarr
   * linked only to this package over one shared with others.
   *
   * One call: `scope=all` lists every asset in the dataset, package-linked ones included.
   * File names and paths aren't in it; resolve those per package with `fetchPackageFile`.
   */
  async function fetchDatasetThumbnails(datasetId) {
    if (!datasetId) return []

    let assets, cloudfront
    try {
      const { data } = await $axios.get(`${config.public.PENNSIEVE_DISCOVER_API_HOST_V2}/packages/discover/assets`, {
        params: { dataset_id: datasetId, scope: 'all' },
      })
      assets = data?.assets || []
      cloudfront = data?.cloudfront || null
    } catch (error) {
      // 404 means the dataset isn't published or has no viewer assets.
      if (error?.response?.status !== 404) {
        console.error('Error fetching dataset viewer assets:', error)
      }
      return []
    }

    const ready = assets.filter((a) => a.status === 'ready')
    const zarrFor = (packageId) => {
      const zarrs = ready.filter(
        (a) => NEUROGLANCER_ASSET_TYPES.includes(a.asset_type) && a.package_ids?.includes(packageId)
      )
      const zarr = zarrs.find((a) => a.package_ids.length === 1) || zarrs[0]
      return zarr ? { ...zarr, cloudfront } : null
    }

    const seenPackages = new Set()
    return ready
      .filter((a) => a.asset_type === THUMBNAIL_ASSET_TYPE)
      .flatMap((asset) => {
        const packageId = asset.package_ids?.[0]
        if (!packageId || seenPackages.has(packageId)) return []
        seenPackages.add(packageId)
        return [{ packageId, thumbnailUrl: thumbnailUrl(asset, cloudfront), zarrAsset: zarrFor(packageId) }]
      })
  }

  /**
   * The published file of a package (Discover): `{ name, path, fileType, uri, size, ... }`,
   * or null if it can't be found.
   */
  async function fetchPackageFile(packageId) {
    if (!packageId) return null
    const { data } = await $axios.get(
      `${config.public.discover_api_host}/packages/${encodeURIComponent(packageId)}/files`
    )
    return data?.files?.[0] || null
  }

  return {
    fetchViewerAssets,
    fetchDatasetThumbnails,
    fetchPackageFile,
  }
}
