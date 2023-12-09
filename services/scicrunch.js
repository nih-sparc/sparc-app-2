let uberonOrganPairs = undefined

const search = query => {
  return apiClient.get('search/' + query)
}

const getDatasetInfoFromObjectIdentifier = async (apiClient, identifier) => {
  const config = {
    params: {
      identifier
    }
  }
  return apiClient.get('dataset_info/using_object_identifier', config)
}
const getDatasetInfoFromPennsieveIdentifier = async (apiClient, identifier) => {
  const config = {
    params: {
      identifier
    }
  }
  return apiClient.get('dataset_info/using_pennsieve_identifier', config)
}

const getDatasetInfoFromDOI = async (apiClient, doi) => {
  const config = {
    params: {
      doi
    }
  }
  return apiClient.get('/dataset_info/using_doi', config)
}

const getImageInfo = async (apiClient, id) => {
  return apiClient.get('image/' + id)
}

const getCollectionInfo = async (apiClient, id) => {
  return apiClient.get('collections/' + id)
}

/**
 * Get the uberon organ pairs array.
 *
 * @returns {String} Array containing organ, uberon id pair
 */
const getUberonOrganPairs = async (apiClient) => {
  if (uberonOrganPairs) return uberonOrganPairs
  else {
    return apiClient.get('get-organ-curies/').then(res => {
      uberonOrganPairs = res.data['uberon']['array']
      return uberonOrganPairs
    })
  }
}

/**
 * Get the organ name from the uberon id using a
 * organ - uberon id map from SciCrunch
 * @param {id} The uberon id
 * @returns {String} the organ name
 */
const getOrganFromUberonId = async (apiClient, id) => {
  return getUberonOrganPairs(apiClient).then(pairs => {
    if (pairs) {
      for (let i = 0; i < pairs.length; i++) {
        if (pairs[i]['id'] === id) {
          return pairs[i]['name']
        }
      }
    }
  })
}

export default {
  getDatasetInfoFromObjectIdentifier,
  getDatasetInfoFromDOI,
  getDatasetInfoFromPennsieveIdentifier,
  search,
  getImageInfo,
  getCollectionInfo,
  getOrganFromUberonId
}
