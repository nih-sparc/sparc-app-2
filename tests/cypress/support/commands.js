// ***********************************************
// This example commands.js shows you how to
// create various custom commands and overwrite
// existing commands.
//
// For more comprehensive examples of custom
// commands please read more here:
// https://on.cypress.io/custom-commands
// ***********************************************
//
//
// -- This is a parent command --
// Cypress.Commands.add('login', (email, password) => { ... })
//
//
// -- This is a child command --
// Cypress.Commands.add('drag', { prevSubject: 'element'}, (subject, options) => { ... })
//
//
// -- This is a dual command --
// Cypress.Commands.add('dismiss', { prevSubject: 'optional'}, (subject, options) => { ... })
//
//
// -- This will overwrite an existing command --
// Cypress.Commands.overwrite('visit', (originalFn, url, options) => { ... })

Cypress.on('uncaught:exception', (err, runnable) => {
  // returning false here prevents Cypress from
  // failing the test
  if (err.message.includes('Avoided redundant navigation to current location'))
    return false
  if (err.message.includes('Maximum iterations reached.'))
    return false
  if (err.message.includes('ResizeObserver loop limit exceeded'))
    return false
  if (err.message.includes('config is not defined'))
    return false
  if (err.message.includes('ResizeObserver loop completed with undelivered notifications'))
    return false
  if (err.message.includes('path.dirname is not a function'))
    return false
  if (err.message.includes("Cannot destructure property 'type' of 'vnode' as it is null"))
    return false
  if (err.message.includes('Cannot read properties of undefined'))
    return false
  if (err.message.includes('Source "markers" already exists.'))
    return false
  if (err.message.includes('node already exist in the graph')) {
    return false
  }
  // // For legacy dataset
  // if (err.message.includes('ObjectID does not exist'))
  //   return false
  return true
})

Cypress.Commands.add('waitForLoadingMask', () => {
  cy.get('.multi-container > .el-loading-parent--relative > .el-loading-mask', { timeout: 30000 }).should(($loadingMask) => {
    expect($loadingMask, 'Loading mask should not exist').to.not.exist
  })
  cy.wait(5000)
})

Cypress.Commands.add('visitLoadedPage', (url) => {
  cy.visit(url)
  cy.waitForLoadingMask()
})

/**
 * Databrowser commands
 */
Cypress.Commands.add('restoreUrlState', (link) => {
  cy.url().then((url) => {
    if (!url.includes(link)) {
      cy.go('back')
      cy.waitForLoadingMask()
    }
  })
  cy.url().then((url) => {
    if (url.includes('search=')) {
      cy.get('.nuxt-icon.nuxt-icon--fill.body1.close-icon').click()
      cy.waitForLoadingMask()
    }
  })
})

Cypress.Commands.add('checkDatasetSorted', (sort) => {
  cy.wait('@query', { timeout: 20000 })
  cy.waitForLoadingMask()
  cy.get('.el-table_1_column_1 > .cell > :nth-child(1) > .img-dataset > img').as('datasetImgs')
  // Get first dataset image alt text
  cy.get('@datasetImgs').first().invoke('attr', 'alt').then((alt) => {
    cy.get('.label1 > .el-dropdown > .filter-dropdown > .el-dropdown-text-link').click()
    cy.get('.el-dropdown-menu > .el-dropdown-menu__item:visible').contains(sort).click()
    if (sort === 'Z-A') {
      cy.wait('@query', { timeout: 20000 })
    }
    cy.waitForLoadingMask()
    // Get last dataset image alt text
    cy.get('@datasetImgs').last().invoke('attr', 'alt').then((alt2) => {
      expect(alt2, `Datasets should match after ${sort} sorting`).to.contains(alt)
    })
  })
})

Cypress.Commands.add('checkFacetCheckbox', (factArray, action, checkbox) => {
  factArray.forEach((facet) => {
    // Check the matched facet checkbox
    cy.wrap(checkbox).contains(new RegExp(`^${facet}$`, 'i')).then(($label) => {
      cy.wrap($label).parent().siblings('.el-checkbox').then(($checkbox) => {
        const isChecked = $checkbox.hasClass('is-checked')
        const isIndeterminate = $checkbox.children().hasClass('is-indeterminate')
        if (action === 'check' && !isChecked) {
          cy.wrap($label).click()
        } else if (action === 'uncheck' && (isChecked || isIndeterminate)) {
          cy.wrap($label).click() // If isIndeterminate after this click checkbox will turn to isChecked
          if (isIndeterminate) {
            cy.wrap($label).click() // One more click to uncheck
          }
        }
      })
    })
  })
})

Cypress.Commands.add('closeFacetTag', (factArray, checkbox) => {
  factArray.forEach((facet) => {
    // Check the matched facet checkbox
    cy.wrap(checkbox).contains(new RegExp(`^${facet}$`, 'i')).then(($label) => {
      cy.wrap($label).parent().siblings('.el-checkbox').then(($checkbox) => {
        const isChecked = $checkbox.hasClass('is-checked')
        const isIndeterminate = $checkbox.children().hasClass('is-indeterminate')
        // Close all facet tags in filters applied box
        if (isChecked) {
          cy.get('.el-card__body > .capitalize').contains(new RegExp(`^${facet}$`, 'i')).siblings().click()
        }
        if (isIndeterminate) {
          cy.get('.el-card__body > .capitalize > .el-tag__close').each(($close) => {
            cy.wrap($close).click()
          })
        }
      })
    })
  })
})

Cypress.Commands.add('checkFilterInitialised', () => {
  cy.get('.el-card__body > .capitalize').should(($card) => {
    expect($card, 'Facet should not be applied').to.not.exist
  })
  cy.get('.no-facets').should(($facetbox) => {
    expect($facetbox, 'No facets should be applied').to.contain('No filters applied')
  })
  cy.url().should((url) => {
    expect(url, 'URL should not contain selected facet IDs').to.not.contain(`selectedFacetIds`)
  })
})

/**
 * datasets commands
 */
Cypress.Commands.add('findGalleryCard', (text, dir) => {
  let direction = '.btn-next'
  const clickNextPageButton = () => {
    cy.get('.el-card > .el-card__body').then(($card) => {
      if (!$card.text().includes(text)) {
        cy.get(direction).then(($button) => {
          if ($button.is(":disabled")) {
            return
          } else {
            cy.wrap($button).click()
            clickNextPageButton()
          }
        })
      }
    })
  }
  if (dir === 'prev') {
    cy.get('.el-pager > .number').last().click()
    direction = '.btn-prev'
  }
  clickNextPageButton()
})
Cypress.Commands.add('backToDetailPage', (datasetId) => {
  cy.url().then((url) => {
    if (!url.includes(`/datasets/${datasetId}?type=dataset`)) {
      cy.go('back')
      cy.waitForLoadingMask()
    }
  })
})

/**
 * mapsviewer commands
 */
Cypress.Commands.add('clickOnNeuron', (coordinate, pixel) => {
  let coorX = coordinate.x
  let coorY = coordinate.y
  cy.get('[style="height: 100%;"] > [style="height: 100%; width: 100%; position: relative;"] > [style="height: 100%; width: 100%;"] > .maplibregl-touch-drag-pan > .maplibregl-canvas').as('canvas');
  const clickOnNeuron = () => {
    cy.get('@canvas').click(coorX, coorY)
    cy.wait(5000)
    cy.get('body').then(($body) => {
      // Keep clicking until the sidebar is opened
      if ($body.find('.sidebar-container > .tab-container').length === 0) {
        coorX -= pixel
        clickOnNeuron()
      }
    })
  }
  clickOnNeuron()
})