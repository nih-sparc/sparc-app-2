import { retryableBefore, stringToArray } from '../support/utils.js'

// x: The distance in pixels from the element's left
// y: The distance in pixels from the element's top
// central coordinate around { 'x': 768, 'y': 373 }
const coordinate = { 'x': 800, 'y': 333 }
const pixelChange = 3

/**
 * Human Female, Human Male, Rat, Mouse, Pig, Cat
 */
const defaultModel = 'Human Male'
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
    cy.waitForViewerContainer('.mapClass')
    cy.waitForPageLoading()
  })

  taxonModels.forEach((model, index) => {

    it(`Provenance card for ${model}`, function () {
      cy.print({
        title: 'loaded model',
        message: `Current loaded model - ${Array.from(loadedModels).join(',')}`,
        type: 'info'
      })
      if (index === 0) {
        loadedModels.add(defaultModel)
        cy.print({
          title: 'model',
          message: `${defaultModel} model has been loaded`,
          type: 'info'
        })
      }
      // Switch to the different flatmap
      cy.get('.el-select.select-box.el-tooltip__trigger.el-tooltip__trigger > .el-select__wrapper').click({ force: true }).then(() => {
        cy.get('.el-select-dropdown__item:visible').should(($dropdown) => {
          expect($dropdown, 'Dropdown should have multiple items').to.have.length(6)
        })
        cy.get('.el-select-dropdown__item:visible').contains(new RegExp(model, 'i')).click({ force: true }).then(() => {
          if (!loadedModels.has(model)) {
            cy.wait('@flatmap', { timeout: 20000 })
            cy.waitForMapLoading()
            loadedModels.add(model)
            cy.print({
              title: 'model',
              message: `${model} model has been loaded`,
              type: 'info'
            })
          }
        })
      })
      // Hide organs and outlines
      cy.get('.settings-group > :nth-child(2):visible').as('settingIcon')
      cy.get('@settingIcon').click()
      cy.get('[role="radiogroup"] > .el-radio:visible').not('.is-checked').click({ multiple: true })
      cy.get('@settingIcon').click()
      // Open a provenance card
      // Not able to click on a specific neuron. Click on different coordinates instead.
      cy.clickOnNeuron(coordinate, pixelChange)
      // Check for the sidebar tabs
      cy.get('.title-text-table > .title-text').should(($title) => {
        expect($title, 'The sidebar should have 2 tabs').to.have.length(2)
      })
      cy.get(':nth-child(2) > .title-text-table > .title-text').as('Connectivity')
      cy.get('.active-tab > .title-text-table > .title-text').as('ActiveTab')
      cy.get('@ActiveTab').should(($tab) => {
        expect($tab, 'Active tab should be Connectivity after clicking on a neuron').to.have.text('Connectivity')
      })
      // Check for the provenance content
      cy.get('.connectivity-info-title').within(($content) => {
        cy.get('.block > .title').then(($title) => {
          expect($title, 'The provenance card should have the neuron name').to.exist
          cy.print({
            title: 'neuron',
            message: `Clicked on the ${$title.text()}`,
            type: 'info'
          })
          cy.get('.el-button.copy-clipboard-button:visible').click()
          cy.window().then(win => {
            win.navigator.clipboard.readText().then(text => {
              expect(text, 'The content should be copied to clipboard').to.contain($title.text().trim())
            })
          })
        })
        cy.get('.block > .subtitle').should(($description) => {
          expect($description, 'The provenance card should have the neuron description').to.exist
        })
        cy.get('.el-button').should(($button) => {
          expect($button, 'The provenance card should have the button to open publications in PubMed').to.exist
        })
        // Check for PubMed button click
        if ($content.text().includes('Open publications in PubMed')) {
          cy.window().then((window) => {
            cy.stub(window, 'open').as('Open')
          })
          cy.get('#open-pubmed-button').click()
          cy.get('@Open').should('have.been.calledOnceWithExactly', Cypress.sinon.match(/^https:\/\/pubmed\.ncbi\.nlm\.nih\.gov(?:\/.*)/), '_blank')
          cy.get('@Open').should('be.calledWith', Cypress.sinon.match.string).then((stub) => {
            const url = stub.args[0][0]
            const termUrl = decodeURIComponent(url.slice(url.indexOf('?term=')))
            const invalidTermFound = ['pubmed', 'doi.org'].some(term => termUrl.includes(term))
            expect(!invalidTermFound, 'Should not contain pubmed or doi.org').to.be.true
          })
        }
      })
      cy.get('.population-display > .buttons-row').as('populationDisplay')
      // List view
      cy.get('@populationDisplay').contains('List view').click()
      // Check for the provenance button click
      cy.get('.sidebar-container > .main > .content-container').then(($content) => {
        cy.wrap($content).get('.attribute-title-container').should(($title) => {
          expect($title, 'The provenance sections should have titles').to.exist
          expect($title.length, 'The provenance should have multiple sections').to.be.greaterThan(0)
        })
        // Check for button click
        const buttonTexts = ['Explore origin data', 'Explore destination data', 'Search for data on components']
        buttonTexts.forEach((text) => {
          if ($content.text().includes(text)) {
            cy.contains(new RegExp(text, 'i')).click({ force: true })
            cy.get('@ActiveTab').should(($tab) => {
              expect($tab, 'Active tab should be Search after clicking on the button').to.contain('Search')
            })
            cy.get('@Connectivity').click({ force: true })
            cy.get('@ActiveTab').should(($tab) => {
              expect($tab, 'Active tab should be Connectivity after clicking on the Connectivity tab').to.contain('Connectivity')
            })
          }
        })
      })
      // Graph view
      cy.get('@populationDisplay').contains('Graph view').click()
      cy.waitForConnectivityGraphLoading()
      cy.get('.connectivity-graph > .graph-canvas').then(($graph) => {
        expect($graph, 'The connectivity graph should exist').to.exist
      })
      cy.get('.connectivity-graph > .control-panel-tools').then(($panelTools) => {
        expect($panelTools, 'The control panel tools should exist').to.exist
      })
      cy.get('.tools > .control-button:visible').then(($tools) => {
        expect($tools, 'The control panel tools should have 2').to.have.length(2)
      })
      cy.get('.tools > :nth-child(2).control-button:visible').click()  
      cy.get('.connectivity-graph > .control-panel-nodes').then(($panelNodes) => {
        expect($panelNodes, 'The control panel nodes should exist').to.exist
        cy.wrap($panelNodes).get('.node-key > .key-box-container > .key-box').then(($keys) => {
          expect($keys, 'The control panel nodes should have at least one key').to.have.length.greaterThan(0)
        })
      })
      // Close the provenance card
      cy.get('.active-tab > .el-button').as('closeTabButton').click()
      cy.get('.sidebar-container > .tab-container').should(($tab) => {
        expect($tab, 'The tab container should not exist').to.not.exist
      })
      cy.get('.close-tab > .el-icon').as('closeSidebarIcon').click()
    })
  })

  it(`From 2D ${threeDSyncView}, open 3D map for synchronised view and Search within display`, function () {
    cy.get('.el-select.select-box.el-tooltip__trigger.el-tooltip__trigger > .el-select__wrapper').click().then(() => {
      cy.get('.el-select-dropdown__item:visible').contains(new RegExp(threeDSyncView, 'i')).click()
      cy.print({
        title: 'loaded model',
        message: `Current loaded model - ${Array.from(loadedModels).join(',')}`,
        type: 'info'
      })
      if (!loadedModels.has(threeDSyncView)) {
        cy.wait('@flatmap', { timeout: 20000 })
        cy.waitForMapLoading()
        loadedModels.add(threeDSyncView)
        cy.print({
          title: 'model',
          message: `${threeDSyncView} model has been loaded`,
          type: 'info'
        })
      }
    })
    // Open the 3D view in a split viewer
    cy.get('.settings-group > :nth-child(1):visible').as('newMapIcon')
    cy.get('@newMapIcon').contains(/Open new map/i).should(($icon) => {
      expect($icon, 'The new map icon should exist').to.exist
    })
    cy.get('@newMapIcon').click()
    cy.get('.open-map-popper:visible > :nth-child(4) > .el-button').as('syncMapButton')
    cy.get('@syncMapButton').contains(/Open Sync Map/i).should(($button) => {
      expect($button, 'The sync map button should exist').to.exist
    })
    cy.get('@syncMapButton').click()
    cy.wait(['@get_body_scaffold_info', '@s3-resource'], { timeout: 20000 })
    cy.waitForMapLoading()
    // Check for the number of displayed viewers
    cy.get('.toolbar > .toolbar-flex-container', { timeout: 30000 }).should(($toolbar) => {
      expect($toolbar, 'Should have two toolbar').to.have.length(2)
    })
    // Check for 3D view's content card detail
    cy.get('.context-card > .card-left > .context-image', { timeout: 30000 }).should(($image) => {
      expect($image, 'The 3D view content card should have an image').to.exist
    })
    cy.get('.context-card > .card-right', { timeout: 30000 }).within(() => {
      cy.get('.title').contains(/3D human whole-body/i).should(($title) => {
        expect($title, 'The 3D view content card title should contain correct content').to.exist
      })
      cy.get(':nth-child(2) > p').contains(/Visualization/i).should(($description) => {
        expect($description, 'The 3D view content card description should contain correct content').to.exist
      })
    })
    cy.get('.subtitle').contains(/Scaffold Views/i).should(($title) => {
      expect($title, 'The 3D view content card subtitle should contain correct content').to.exist
    })
    cy.get('.view-image').should('exist')
    cy.get('.view-image').should(($image) => {
      expect($image, 'The 3D view content card should have an scaffold view image').to.exist
    })
    cy.get('.view-description').contains(/Human whole-body/i).should(($description) => {
      expect($description, 'The 3D view content card should have an scaffold view description').to.exist
    })
    // Close the pathway sidebar
    cy.get('[style="height: 100%;"] > [style="height: 100%; width: 100%; position: relative;"] > .pathway-location > .drawer-button').click()
    // Search keyword in displayed viewers
    cy.get('.el-autocomplete > .el-input > .el-input__wrapper').type(searchInMap)
    cy.get('.search-container > .map-icon > use').as('mapSearchIcon').click()
    // Check for keyword(highlighted part) in displayed viewers
    cy.get('.maplibregl-popup-content').contains(new RegExp(searchInMap, 'i')).should(($tooltip) => {
      expect($tooltip, 'The tooltip should contain the search keyword').to.exist
    })
  })

  scaffoldDatasetIds.forEach((datasetId) => {

    it(`Context card for scaffold dataset ${datasetId}`, function () {
      cy.waitForMapLoading()
      // Open the sidebar
      cy.get('.open-tab > .el-icon').as('openSidebarIcon').click()
      // Search dataset id
      cy.get('.search-input > .el-input__wrapper:visible').as('searchBox')
      cy.get('@searchBox').clear()
      cy.get('@searchBox').type(datasetId)
      cy.get('.header > .el-button > span:visible').as('sidebarSearchButton').click()
      cy.wait(5000)
      cy.wait('@query', { timeout: 20000 }).then((intercept) => {
        cy.get('.dataset-results-feedback:visible', { timeout: 30000 }).then(($result) => {
          if (intercept.response.body.hits.length === 0 || $result.text().match(/^0 Results \| Showing/i)) {
            // Empty text should show up if no result
            cy.get('.error-feedback').should(($text) => {
              expect($text, 'Empty result message should be displayed').to.contain('No results found')
            })
            cy.print({
              title: 'search',
              message: 'Empty result, please try different scaffold datasets',
              type: 'warning'
            })
          } else {
            cy.wait(['@dataset_info', '@datasets'], { timeout: 20000 })
            // Check for search result and the tag 'Scaffold'
            cy.get('.dataset-card-container > .dataset-card', { timeout: 30000 }).as('datasetCards')
            cy.get('@datasetCards').contains(datasetId).should(($card) => {
              expect($card, 'The search result should contain the specific dataset card').to.exist
            })
            cy.get('@datasetCards').filter(`:contains(${datasetId})`).within(() => {
              cy.get('.badges-container > .container', { timeout: 30000 }).as('tags')
              cy.get('@tags').contains(/Scaffold/i).should(($tag) => {
                expect($tag, 'The dataset card should contain the scaffold tag').to.exist
              })
              cy.get('@tags').contains(/Scaffold/i).click()
            })
            // Check for button text
            cy.get('.dataset-card-container > .dataset-card', { timeout: 30000 }).contains(/View Scaffold/i).click()
            cy.wait('@s3-resource', { timeout: 20000 })
            // Check for context card
            cy.get('.context-card').should(($card) => {
              expect($card, 'The context card should be displayed').to.be.visible
            })
            cy.get('.context-image').should(($image) => {
              expect($image, 'The context card should have an image').to.exist
            })
            cy.get('.card-right > :nth-child(1) > .title').should(($title) => {
              expect($title, 'The context card should have a title class').to.have.class('title')
            })
            cy.get('.card-right > :nth-child(1) > :nth-child(2) > :nth-child(1)').should(($description) => {
              expect($description, 'The context card should have a description').to.exist
            })
          }
        })
      })
    })
  })
})