import { retryableBefore, stringToArray } from '../../support/utils.js'

/**
 * List of dataset ids
 */
const datasetIds = stringToArray(Cypress.env('DATASET_IDS'), ',')

const galleryItems = ['Scaffold', 'Video', 'Flatmap', 'Segmentation', 'Plot', 'Image']

datasetIds.forEach((datasetId) => {

  describe(`Dataset ${datasetId}`, { testIsolation: false }, function () {

    let existGalleryItems = []

    retryableBefore(function () {
      cy.visit(`/datasets/${datasetId}?type=dataset&datasetDetailsTab=images`)
    })

    beforeEach(function () {
      cy.intercept('**/dataset_info/using_doi?**').as('dataset_info')
      cy.waitForPageLoading()
    })

    it('Gallery Item', function () {
      cy.wait(5000)
      cy.wait('@dataset_info', { timeout: 20000 }).then((intercept) => {
        const response = intercept.response.body.result[0]
        // Check if gallery cards loaded
        if (
          ('abi-scaffold-metadata-file' in response && response['abi-scaffold-metadata-file'].length) ||
          ('video' in response && response['video'].length) ||
          ('organs' in response && response['organs'].length) ||
          ('mbf-segmentation' in response && response['mbf-segmentation'].length) ||
          ('abi-plot' in response && response['abi-plot'].length) ||
          ('common-images' in response && response['common-images'].length) ||
          ('biolucida-2d' in response && response['biolucida-2d'].length) ||
          ('biolucida-3d' in response && response['biolucida-3d'].length)
        ) {
          if ('abi-scaffold-metadata-file' in response && response['abi-scaffold-metadata-file'].length) {
            existGalleryItems.push('Scaffold')
          }
          if ('video' in response && response['video'].length) {
            existGalleryItems.push('Video')
          }
          if ('organs' in response && response['organs'].length) {
            existGalleryItems.push('Flatmap')
          }
          if ('mbf-segmentation' in response && response['mbf-segmentation'].length) {
            existGalleryItems.push('Segmentation')
          }
          if ('abi-plot' in response && response['abi-plot'].length) {
            existGalleryItems.push('Plot')
          }
          if (
            ('common-images' in response && response['common-images'].length) ||
            ('biolucida-2d' in response && response['biolucida-2d'].length) ||
            ('biolucida-3d' in response && response['biolucida-3d'].length)
          ) {
            existGalleryItems.push('Image')
          }
          cy.checkGalleyCardState()
        } else {
          cy.get('.content > .full-size').should(($message) => {
            expect($message, 'Gallery items not exist').to.contain('This dataset does not contain gallery items')
          })
        }
      })
    })

    describe('Viewer', { testIsolation: false }, function () {

      galleryItems.forEach((item) => {

        it(item, function () {
          if (existGalleryItems.includes(item)) {
            cy.get('.filter-container > .filter-dropdown').click()
            cy.get('.el-cascader-node').then(($content) => {
              if (!$content.text().includes(item) && !$content.text().includes(item.toLowerCase())) {
                this.skip()
              }
              cy.get('.filter-container > .filter-dropdown').click()
            })
            cy.checkGalleryItemViewer(datasetId, item)
          } else {
            this.skip()
          }
        })
      })
    })
  })
})