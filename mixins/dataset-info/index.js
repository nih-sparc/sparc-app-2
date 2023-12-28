import { isEmpty } from 'ramda'
export default {
  methods: {
    /**
     * Fetch dataset information from discover api with dataset id and version
     */
    getDatasetInfo: async function(axios, datasetId, datasetVersion, userToken) {
      const url = `${this.$config.public.discover_api_host}/datasets/${datasetId}`
      var datasetUrl = datasetVersion ? `${url}/versions/${datasetVersion}` : url
      if (!isEmpty(userToken) && userToken != null) {
        datasetUrl += `?api_key=${userToken}`
      }
      let datasetInfo = {}
      await axios.get(datasetUrl).catch(error => {
        console.log(`Could not get the dataset's info: ${error}`)
      }).then(({ data }) => {
        datasetInfo = data
      })
      return datasetInfo
    }
  }
}
