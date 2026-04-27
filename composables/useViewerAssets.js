export const NEUROGLANCER_ASSET_TYPES = ['ome-zarr', 'neuroglancer-precomputed']

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

  return {
    fetchViewerAssets,
  }
}
