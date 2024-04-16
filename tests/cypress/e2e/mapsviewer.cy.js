// Human Female, Human Male, Rat, Mouse, Pig, Cat
// const taxonModels = ['Rat']
const taxonModels = ['Rat', 'Human Female']
// x: The distance in pixels from the element's left
// y: The distance in pixels from the element's top
// central coordinate { 'x': 768, 'y': 373 }
const coordinate = { 'x': 800, 'y': 333 }
const pixelChange = 3

/**
 * Name of species for the 3D sync map
 * 'Human Female', 'Human Male', 'Rat'
 */
const threeDSyncView = Cypress.env('THREE_SYNC_VIEW')

const searchInMap = 'heart'

const scaffoldDatasetIds = Cypress.env('SCAFFOLD_DATASET_IDS').split(',').map(item => item.trim()).filter(item => item)

describe('Maps Viewer', { testIsolation: false }, function () {
  before(function () {
    cy.visit('/maps?type=ac')
  })

  beforeEach(function () {
    cy.intercept('**/flatmap/**').as('flatmap')
    cy.intercept('**/get_body_scaffold_info/**').as('get_body_scaffold_info')
    cy.intercept('**/s3-resource/**').as('s3-resource')
    cy.intercept('**/query?**').as('query')
    cy.intercept('**/dataset_info/**').as('dataset_info')
    cy.intercept('**/datasets/**').as('datasets')
  })

  taxonModels.forEach((model) => {

    it(`Provenance card for ${model}`, function () {
      // Loading mask should not exist after the new flatmap is loaded
      cy.get('.multi-container > .el-loading-parent--relative > .el-loading-mask', { timeout: 30000 }).should('not.exist')

      if (model !== 'Rat') {
        // Switch to the second flatmap
        cy.get('#flatmap-select').click()
        cy.get('.el-select-dropdown__item').should('be.visible')
        cy.get('.el-select-dropdown__item:visible').contains(new RegExp(model, 'i')).click({ force: true })
      }

      cy.wait('@flatmap', { timeout: 20000 })

      // Loading mask should not exist after the new flatmap is loaded
      cy.get('.multi-container > .el-loading-parent--relative > .el-loading-mask', { timeout: 30000 }).should('not.exist')

      // Hide organs and outlines
      cy.get('.settings-group > :nth-child(2):visible').click({ waitForAnimations: false })
      cy.get('[role="radiogroup"] > .el-radio:visible').not('.is-checked').click({ multiple: true });
      cy.get('.settings-group > :nth-child(2):visible').click({ waitForAnimations: false })

      cy.get('[style="height: 100%;"] > [style="height: 100%; width: 100%; position: relative;"] > [style="height: 100%; width: 100%;"] > .maplibregl-touch-drag-pan > .maplibregl-canvas').as('canvas');
      // Open a provenance card
      cy.clickNeuron(coordinate, pixelChange)
    })
  })

  it(`From 2D ${threeDSyncView}, open 3D map for synchronised view and Search within display`, function () {
    // Loading mask should not exist after the default flatmap is loaded
    cy.get('.multi-container > .el-loading-parent--relative > .el-loading-mask', { timeout: 30000 }).should('not.exist')

    // Switch to the human related flatmap
    cy.get('#flatmap-select').click()
    cy.get('.el-select-dropdown__item').contains(new RegExp(threeDSyncView, 'i')).click({ force: true })

    cy.wait('@flatmap', { timeout: 20000 })

    // Loading mask should not exist after the new flatmap is loaded
    cy.get('.multi-container > .el-loading-parent--relative > .el-loading-mask', { timeout: 30000 }).should('not.exist')

    // Open the 3D view in a split viewer
    cy.get('.settings-group > :nth-child(1):visible').contains(/Open new map/i).should('exist')
    cy.get('.settings-group > :nth-child(1):visible').click()
    cy.get('.open-map-popper:visible > :nth-child(4) > .el-button').contains(/Open Sync Map/i).should('exist')
    cy.get('.open-map-popper:visible > :nth-child(4) > .el-button').click()

    cy.wait(['@get_body_scaffold_info', '@s3-resource'], { timeout: 20000 })

    // Check for the number of displayed viewers
    cy.get('.toolbar > .toolbar-flex-container', { timeout: 30000 }).should('have.length', 2)

    // Check for 3D view's content card detail
    cy.get('.context-card > .card-left > .context-image', { timeout: 30000 }).should('exist')
    cy.get('.context-card > .card-right', { timeout: 30000 }).within(() => {
      cy.get('.title').contains(/3D human whole-body/i).should('exist')
      cy.get(':nth-child(2) > p').contains(/Visualization/i).should('exist')
      cy.get('.subtitle').contains(/Scaffold Views/i).should('exist')
      cy.get('.view-image').should('exist')
      cy.get('.view-description').contains(/Human whole-body/i).should('exist')
    })

    // Close the pathway sidebar
    cy.get('[style="height: 100%;"] > [style="height: 100%; width: 100%; position: relative;"] > .pathway-location > .drawer-button > .el-icon-arrow-left').click()

    // Search keyword in displayed viewers
    cy.get('.el-autocomplete > .el-input > .el-input__inner').type(searchInMap)
    cy.get('.search-container > .map-icon > use').click()

    // Check for keyword(highlighted part) in displayed viewers
    cy.get('.maplibregl-popup-content').contains(new RegExp(searchInMap, 'i')).should('exist')

    cy.visit('/maps?type=ac')
  })

  scaffoldDatasetIds.forEach((datasetId) => {

    it(`Context card in sidebar for scaffold dataset ${datasetId}`, function () {

      // Open the sidebar
      cy.get('.open-tab > .el-icon').click()

      // Search dataset id
      cy.get('.search-input > .el-input__wrapper').clear()
      cy.get('.search-input > .el-input__wrapper').type(datasetId)
      cy.get('.header > .el-button > span').click()

      cy.wait('@query', { timeout: 20000 })

      cy.get('.dataset-results-feedback').then(($result) => {
        const noResult = $result.text() === '0 results | Showing'
        if (noResult) {
          // Error message should exist if no result
          cy.get('.error-feedback').should('exist')
          cy.get('.error-feedback').contains(/No results found/i).should('exist')
        } else {

          cy.wait(['@dataset_info', '@datasets'], { timeout: 20000 })

          // Check for search result and the tag 'Scaffold'
          cy.get('.dataset-card-container > .dataset-card', { timeout: 30000 }).contains(datasetId).should('exist')
          cy.get('.dataset-card-container > .dataset-card').filter(`:contains(${datasetId})`).within(() => {
            cy.get('.badges-container > .container', { timeout: 30000 }).contains(/Scaffold/i).should('exist')
            cy.get('.badges-container > .container').contains(/Scaffold/i).click()
          })

          // Check for button text
          cy.get('.dataset-card-container > .dataset-card', { timeout: 30000 }).contains(/View Scaffold/i).should('exist').click()

          // Loading mask should not exist after the scaffold is loaded
          cy.get('.multi-container > .el-loading-parent--relative > .el-loading-mask', { timeout: 30000 }).should('not.exist')

          // Check for context card
          cy.get('.context-card').should('be.visible')
          cy.get('.context-image:visible').should('have.attr', 'src').and('contain', `https://assets.discover.pennsieve.io/dataset-assets/${datasetId}`)
          cy.get('[style="margin-right: 8px;"] > .title:visible').should('have.class', 'title')
        }
      })
    })
  })
})