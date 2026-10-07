import { usePublicFileLink } from '@/composables/usePublicFileLink'

const browse = async (id, version, path = undefined) => {
  const { $portalApiClient } = useNuxtApp()

  let config = {}
  if (path) {
    config = {
      params: {
        path: path,
        limit: 253
      }
    }
  }
  return $portalApiClient.get(`/${id}/versions/${version}/files/browse`, config)
}

const fetch = async (id, path, encode_base_64, s3Bucket) => {
  const { $portalApiClient } = useNuxtApp()

  const config = {
    params: {
      encodeBase64: encode_base_64
    }
  }
  if (s3Bucket) {
    config.params.s3BucketName = s3Bucket
  }
  return await $portalApiClient.get(
    `/s3-resource/${id}/files/${path}`,
    config
  )
}

const fetchEmbeddedThumbnail = async (id, path, s3Bucket) => {
  const { $portalApiClient } = useNuxtApp()

  const config = {
    params: {
      path: `${id}/files/${path}`
    }
  }
  if (s3Bucket) {
    config.params.s3BucketName = s3Bucket
  }
  return await $portalApiClient.get('/thumbnail/segmentation', config)
}

const getSegmentationInfo = async (id, path, s3Bucket) => {
  const { $portalApiClient } = useNuxtApp()

  const config = {
    params: {
      dataset_path: `${id}/${path}`
    }
  }
  if (s3Bucket) {
    config.params.s3BucketName = s3Bucket
  }
  return $portalApiClient.get('/segmentation_info', config)
}

// A download-service view link to a file of a published version, for a viewer to read it
const viewLink = async (id, version, path) => {
  const { url } = await usePublicFileLink({ datasetId: id, version, path, purpose: 'view' })
  return url
}

const getDiscoverPath = (source_identifier) => {
  const { $portalApiClient } = useNuxtApp()
  
  const config = {
    params: {
      uri: source_identifier
    }
  }
  const response = $portalApiClient.get('/s3-resource/discover_path', config)
  return response
}

export default {
  browse,
  viewLink,
  fetch,
  fetchEmbeddedThumbnail,
  getDiscoverPath,
  getSegmentationInfo
}
