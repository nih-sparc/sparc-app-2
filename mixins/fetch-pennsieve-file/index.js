import ErrorMessages from '@/mixins/error-messages'

export default {
  methods: {
    /**
     * Workaround to using pennsieve endpoint https://docs.pennsieve.io/reference/getfile-1 to get the file
     * we can replace this once the discrepencies between the getFile and browseFiles pennsieve endpoint responses are figured out
     * for files containing multiple extensions.
     *
     * errorReporting is the nuxt error callable object which will be called when the method encounter an error
     * or no file can be found and cause the error page to render
     */
    fetchPennsieveFile: async function(filePath, datasetId, datasetVersion, errorReporting) {
      try {
        const config = useRuntimeConfig()
        const {  $pennsieveApiClient } = useNuxtApp()
        const fileLocationEndIndex = filePath.lastIndexOf('/')
        const filesLocation = filePath.substring(0, fileLocationEndIndex)
        const filesUrl = `${config.public.discover_api_host}/datasets/${datasetId}/versions/${datasetVersion}/files/browse`
        const limit = 100
        let offset = 0
        let foundFile = {}
        const searchFilePath = filePath.toLowerCase()

        // Fetch up to `limit` files per batch and search each batch for the matching file.
        // Stop as soon as the file is found, or when there are no more files left to search.
        while (Object.keys(foundFile).length === 0) {
          const pageResponse = await $pennsieveApiClient.value.get(filesUrl, {
            params: { path: filesLocation, limit, offset }
          })
          const page = pageResponse.data
          const pageFiles = page?.files || []
          const totalCount = page?.totalCount ?? pageFiles.length

          // No more files left to search; terminate.
          if (pageFiles.length === 0) {
            console.warn(`
            WARNING! the file "${filePath}" was just attempted to download from ${filesUrl} , This will likely crash the page using this file`)
            break
          }

          // Look for the matching file within this batch.
          foundFile = pageFiles.find(file => {
            // Check if path matches query param.
            if (searchFilePath == file.path.toLowerCase()) {
              return true
            } else if (file.uri) {
              // Check if uri matches filePath query param.
              let uriFile = file.uri.substring(file.uri.lastIndexOf('/'))
              if (uriFile) {
                uriFile = uriFile.toLowerCase()
              }
              if (searchFilePath.includes(uriFile)) {
                return true
              }
            }
            return false
          }) || {}

          // File not found in this batch; fetch the next one.
          offset += limit
          if (offset >= totalCount) {
            break
          }
        }

        if (errorReporting && (Object.keys(foundFile).length === 0)) {
          throw "File cannot be found"
        }

        return foundFile
      }
      catch {
        if (errorReporting) {
          const message = ErrorMessages.methods.pennsieveFile()
          return errorReporting({ statusCode: 400, message: message, display: true})
        }
        else
          return {}
      }
    }
  }
}
