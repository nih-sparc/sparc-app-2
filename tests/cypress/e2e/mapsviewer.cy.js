import { retryableBefore } from "../support/retryableBefore.js"
import { stringToArray } from "../support/stringToArray.js"

// x: The distance in pixels from the element's left
// y: The distance in pixels from the element's top
// central coordinate around { 'x': 768, 'y': 373 }
const coordinate = { 'x': 800, 'y': 333 }
const pixelChange = 3

/**
 * Human Female, Human Male, Rat, Mouse, Pig, Cat
 */
const taxonModels = stringToArray(Cypress.env('TAXON_MODELS'), ',')
let loadedModels = new Set()

/**
 * Name of species for the 3D sync map
 * 'Human Female', 'Human Male', 'Rat'
 */
const threeDSyncView = Cypress.env('THREE_SYNC_VIEW')

const searchInMap = Cypress.env('SEARCH_IN_MAP')

const scaffoldDatasetIds = stringToArray(Cypress.env('SCAFFOLD_DATASET_IDS'), ',')

describe('Maps Viewer', { testIsolation: false }, function () {
  retryableBefore(function () {
    cy.visit('/maps?type=ac')
  })

  beforeEach(function () {
    cy.intercept('**/query?**').as('query')
    cy.intercept('**/flatmap/**').as('flatmap')
    cy.intercept('**/dataset_info/**').as('dataset_info')
    cy.intercept('**/datasets/**').as('datasets')
    cy.intercept('**/get_body_scaffold_info/**').as('get_body_scaffold_info')
    cy.intercept('**/s3-resource/**').as('s3-resource')
  })

  taxonModels.forEach((model, index) => {

    it(`Provenance card for ${model}`, function () {
      if (index === 0) {
        cy.wait(['@query', '@flatmap', '@dataset_info', '@datasets'], { timeout: 20000 })
        cy.waitForLoadingMask()
        loadedModels.add('Human Male')
      }

      // Switch to the second flatmap
      cy.get('.el-select.select-box.el-tooltip__trigger.el-tooltip__trigger > .el-select__wrapper').click({ force: true })
      cy.get('.el-select-dropdown__item').should('be.visible')
      cy.get('.el-select-dropdown__item:visible').contains(new RegExp(model, 'i')).click({ force: true }).then(() => {
        if (!loadedModels.has(model)) {
          cy.wait(['@flatmap'], { timeout: 20000 })
          cy.waitForLoadingMask()
          loadedModels.add(model)
        }
      })

      // Hide organs and outlines
      cy.get('.settings-group > :nth-child(2):visible').click({ waitForAnimations: false })
      cy.get('[role="radiogroup"] > .el-radio:visible').not('.is-checked').click({ waitForAnimations: false, multiple: true });
      cy.get('.settings-group > :nth-child(2):visible').click({ waitForAnimations: false })

      cy.get('[style="height: 100%;"] > [style="height: 100%; width: 100%; position: relative;"] > [style="height: 100%; width: 100%;"] > .maplibregl-touch-drag-pan > .maplibregl-canvas').as('canvas');
      
      // Open a provenance card
      cy.clickOnNeuron(coordinate, pixelChange)

      // Check for the sidebar tabs
      cy.get('.title-text-table > .title-text').should('have.length', 2)
      cy.get(':nth-child(2) > .title-text-table > .title-text').as('Connectivity')
      cy.get('.active-tab > .title-text-table > .title-text').as('ActiveTab')
      cy.get('@ActiveTab').should('contain', 'Connectivity')

      // Check for the provenance content
      cy.get('.connectivity-info-title').within(($content) => {
        cy.get('.block > .title').should('exist')
        cy.get('.block > .subtitle').should('exist')
        cy.get('.el-button').should('exist')

        // Check for button click
        if ($content.text().includes('Open publications in PubMed')) {
          cy.window().then((window) => {
            cy.stub(window, 'open').as('Open')
          })
          cy.get('#open-pubmed-button').click()
          cy.get('@Open').should('have.been.calledOnceWithExactly', Cypress.sinon.match(/^https:\/\/pubmed\.ncbi\.nlm\.nih\.gov(?:\/.*)/), '_blank')
          cy.get('@Open').should('be.calledWith', Cypress.sinon.match.string).then((stub) => {
            const url = stub.args[0][0]
            const termUrl = decodeURIComponent(url.slice(url.indexOf("?term=")));
            const invalidTermFound = ['pubmed', 'doi.org'].some(term => termUrl.includes(term))
            expect(!invalidTermFound, 'Should not contain pubmed or doi.org').to.be.true
          })
        }
      })

      // Check for the provenance content
      cy.get('.sidebar-container > .main > .content-container').then(($content) => {
        cy.wrap($content).get('.attribute-title-container').should('exist')

        // Check for button click
        const buttonTexts = ['Explore origin data', 'Explore destination data', 'Search for data on components']
        buttonTexts.forEach((text) => {
          if ($content.text().includes(text)) {
            cy.contains(/Explore destination data/i).click({force: true})
            cy.get('@ActiveTab').should('contain', 'Search')
            cy.get('@Connectivity').click({force: true})
            cy.get('@ActiveTab').should('contain', 'Connectivity')
          }
        })
      })
      
      // Close the provenance card
      cy.get('.active-tab > .el-button').click()
      cy.get('.sidebar-container > .tab-container').should('not.exist')
      cy.get('.close-tab > .el-icon').click()
    })
  })

  it(`From 2D ${threeDSyncView}, open 3D map for synchronised view and Search within display`, function () {
    // Switch to the human related flatmap
    cy.get('.el-select-dropdown__item').contains(new RegExp(threeDSyncView, 'i')).click({ force: true })
    cy.get('.el-select.select-box.el-tooltip__trigger.el-tooltip__trigger').click({ force: true }).then(() => {
      if (!loadedModels.has(threeDSyncView)) {
        cy.wait(['@flatmap'], { timeout: 20000 })
        cy.waitForLoadingMask()
        loadedModels.add(threeDSyncView)
      }
    })

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
    })
    cy.get('.context-card > .card-bottom', { timeout: 30000 }).within(() => {
      cy.get('.subtitle').contains(/Scaffold Views/i).should('exist')
      cy.get('.view-image').should('exist')
      cy.get('.view-description').contains(/Human whole-body/i).should('exist')
    })

    // Close the pathway sidebar
    cy.get('[style="height: 100%;"] > [style="height: 100%; width: 100%; position: relative;"] > .pathway-location > .drawer-button > .el-icon').click()

    // Search keyword in displayed viewers
    cy.get('.el-autocomplete > .el-input > .el-input__wrapper').type(searchInMap)
    cy.get('.search-container > .map-icon > use').click()

    // Check for keyword(highlighted part) in displayed viewers
    cy.get('.maplibregl-popup-content').contains(new RegExp(searchInMap, 'i')).should('exist')

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
      cy.waitForLoadingMask()

      cy.get('.dataset-results-feedback', { timeout: 30000 }).then(($result) => {
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

          cy.waitForLoadingMask()

          // Check for button text
          cy.get('.dataset-card-container > .dataset-card', { timeout: 30000 }).contains(/View Scaffold/i).should('exist').click()

          cy.waitForLoadingMask()

          // Check for context card
          cy.get('.context-card').should('be.visible')
          cy.get('.context-card > .card-left > .context-image').should('exist')
          cy.get('.context-card > .card-right > :nth-child(1) > .title').should('have.class', 'title')
        }
      })
    })
  })
})