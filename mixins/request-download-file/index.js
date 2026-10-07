import { propOr } from 'ramda'
import { downloadPublicFile, usePublicFileLink } from '@/composables/usePublicFileLink'
import { datasetIdOf, filePathOf } from '@/utils/publicDownloads'
import { failMessage } from '@/utils/notification-messages'

export default {
  methods: {
    /**
     * Download a file through a download-service link. The browser saves it under the file's name
     */
    requestDownloadFile: function(downloadInfo) {
      return downloadPublicFile({
        datasetId: datasetIdOf(downloadInfo),
        version: propOr('', 'version', downloadInfo),
        path: filePathOf({ uri: downloadInfo.uri })
      }).catch(e => {
        failMessage(e.message || "Couldn't download the file. Try again.")
      })
    },
    /**
     * Request file contents through a download-service view link. This returns a promise which resolves to the contents of the file to then be used withing sparc-app (ie to display markdown)
     */
    async requestFileContent(downloadInfo) {
      const { url } = await usePublicFileLink({
        datasetId: datasetIdOf(downloadInfo),
        version: propOr('', 'version', downloadInfo),
        path: filePathOf({ uri: downloadInfo.uri }),
        purpose: 'view'
      })
      const response = await fetch(url)
      if (!response.ok) {
        throw new Error(`Failed to fetch file: ${response.statusText}`)
      }
      return response.text()
    }
  }
}
