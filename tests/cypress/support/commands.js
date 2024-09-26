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

import { randomInteger } from '../support/utils.js'

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
  if (err.message.includes('node already exist in the graph'))
    return false
  if (err.message.includes('message.startsWith is not a function'))
    return false
  // // For legacy dataset
  // if (err.message.includes('ObjectID does not exist'))
  //   return false
  return true
})

Cypress.Commands.add('waitForBrowserLoading', () => {
  cy.get('.el-loading-mask', { timeout: 30000 }).should(($loadingMask) => {
    expect($loadingMask, 'Browser loading mask should not exist').to.not.exist
  })
  cy.wait(5000)
})

Cypress.Commands.add('waitForPageLoading', () => {
  cy.get('.loading-container', { timeout: 30000 }).should(($loadingMask) => {
    expect($loadingMask, 'Page loading mask should not exist').to.not.exist
  })
  cy.wait(5000)
})

Cypress.Commands.add('waitForMapLoading', () => {
  cy.get('.multi-container > .el-loading-parent--relative > .el-loading-mask', { timeout: 30000 }).should(($loadingMask) => {
    expect($loadingMask, 'Map loading mask should not exist').to.not.exist
  })
  cy.wait(5000)
})

Cypress.Commands.add('waitForViewerContainer', (selector) => {
  cy.get(selector, { timeout: 30000 }).should(($mapViewer) => {
    expect($mapViewer, 'Viewer container should exist').to.exist
  })
  cy.wait(5000)
})

/**
 * Databrowser commands
 */
Cypress.Commands.add('restoreUrlState', (link) => {
  cy.url().then((url) => {
    if (!url.includes(link)) {
      cy.go('back')
      cy.waitForPageLoading()
    }
  })
  cy.url().then((url) => {
    if (url.includes('search=')) {
      cy.get('.nuxt-icon.nuxt-icon--fill.body1.close-icon').click()
      cy.waitForPageLoading()
    }
  })
})

Cypress.Commands.add('checkDatasetSort', (sortType) => {
  cy.waitForBrowserLoading()
  cy.get('.el-table_1_column_1 > .cell > :nth-child(1) > .img-dataset > img').as('datasetImgs')
  // Get first dataset image alt text
  cy.get('@datasetImgs').first().invoke('attr', 'alt').then((alt) => {
    cy.get('.label1 > .el-dropdown > .filter-dropdown > .el-dropdown-text-link').click()
    cy.get('.el-dropdown-menu > .el-dropdown-menu__item:visible').contains(sortType).click()
    cy.waitForBrowserLoading()
    // Get last dataset image alt text
    cy.get('@datasetImgs').last().invoke('attr', 'alt').then((alt2) => {
      expect(alt2, `Datasets should match after sorting by ${sortType}`).to.contains(alt)
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
    expect(url, 'URL should not contain selected facet IDs').to.not.contain('selectedFacetIds')
  })
})

/**
 * datasets commands
 */
Cypress.Commands.add('clickOnDetailTab', (tabName) => {
  let tabExist = false
  cy.get('#datasetDetailsTabsContainer > .style1').then(($tabs) => {
    if ($tabs.text().includes(tabName)) {
      tabExist = true
      cy.wrap($tabs).contains(tabName).click()
      cy.get('.active.style1.tab2.tab-link.p-16').should(($tab) => {
        expect($tab, 'Tab should be activated').to.contain(tabName)
      })
    }
    cy.then(() => {
      return tabExist
    })
  })
})

Cypress.Commands.add('backToDetailPage', (datasetId) => {
  let retry = 0
  const backToDetailPage = () => {
    cy.url().then((url) => {
      if (!url.includes(`/datasets/${datasetId}?type=dataset`)) {
        cy.go('back')
        cy.waitForPageLoading()
        retry += 1
      }
      if (retry > 3) {
        cy.visit(`/datasets/${datasetId}?type=dataset`)
      }
      if (!url.includes(`/datasets/${datasetId}?type=dataset`)) {
        backToDetailPage()
      }
    })
  }
  backToDetailPage()
})

Cypress.Commands.add('checkGalleyCardState', () => {
  const clickNextPageButton = () => {
    cy.get('.el-card > .el-card__body').each(($card) => {
      cy.wrap($card).within(() => {
        cy.get('.details > .el-button').then(($button) => {
          if (!$button.text().includes('flatmap')) {
            cy.get('.cursor-pointer > .thumbnail').should(($image) => {
              expect($image, 'Image should be loaded').to.have.prop('naturalWidth').to.be.greaterThan(0)
            })
            cy.get('.details > .el-tooltip__trigger > .title').should(($title) => {
              expect($title, 'Title should exist').to.not.have.text('')
            })
            cy.get('.details > .el-button').should(($button) => {
              expect($button, 'View button should exist').to.contain('View')
            })
          }
        })
      })
    })
    cy.get('.btn-next').then(($button) => {
      if ($button.is(':disabled')) {
        cy.get('.el-pager > .number').first().click()
      } else {
        cy.wrap($button).click()
        clickNextPageButton()
      }
    })
  }
  clickNextPageButton()
})

Cypress.Commands.add('checkGalleryItemViewer', (datasetId, itemType) => {
  cy.get('.filter-container > .filter-dropdown').click()
  cy.get('.el-cascader-node').contains(new RegExp(itemType, 'i')).parent().siblings().click()
  cy.window().then((window) => {
    cy.stub(window.document.body, 'appendChild').as('cardClicked')
  })
  cy.get('.el-pager > .number').then(($pages) => {
    if ($pages.length > 1) {
      const randomPage = randomInteger(0, $pages.length - 1)
      cy.wrap($pages).eq(randomPage).click()
    }
    cy.get('.el-card > .el-card__body').then(($cards) => {
      const randomCard = randomInteger(0, $cards.length - 1)
      cy.wrap($cards).eq(randomCard).then(($card) => {
        cy.wrap($card).find('.el-button').click()
        cy.get('@cardClicked').should('be.calledWith', Cypress.sinon.match.any).then((stub) => {
          // Appended link element
          const element = stub.args[0][0]
          expect(element, 'Button should open a new tab').to.have.attr('target').to.contain('blank')
          cy.visit(element.href)
          cy.waitForPageLoading()
          if (itemType === 'Scaffold' || itemType === 'Flatmap') {
            // Check whether map viewer loaded or not
            cy.waitForViewerContainer('.mapClass')
            cy.get('.page-hero > .container').should(($content) => {
              expect($content, 'Map Viewer should display content').to.contain('Maps')
            })
            cy.backToDetailPage(datasetId)
            cy.waitForPageLoading()
          } else {
            // Check whether metadata exist or not
            cy.waitForViewerContainer('.subpage')
            cy.get('.subpage > .file-detail > :nth-child(2)').each(($row) => {
              expect($row.text().length, 'Viewer metadata should exist').to.be.greaterThan(0)
            })
            cy.get('.subpage').contains('File location').siblings().find('a').then(($link) => {
              cy.wrap($link).click()
              cy.waitForPageLoading()
              const breadcrumbs = $link.text().split('/')
              cy.get('.breadcrumb-list .breadcrumb-link').each(($breadcrumb) => {
                expect(breadcrumbs, 'Filepath should contain all breadcrumbs').to.include($breadcrumb.text())
              })
              cy.get('.cell').contains(breadcrumbs[breadcrumbs.length - 1]).should(($filename) => {
                expect($filename, 'Filename should exist').to.exist
              })
            })
          }
          cy.then(() => {
            cy.clickOnDetailTab('Gallery')
          })
        })
      })
    })
  })
})

/**
 * mapsviewer commands
 */
Cypress.Commands.add('clickOnNeuron', (coordinate, pixel) => {
  let coorX = coordinate.x
  let coorY = coordinate.y
  cy.get('[style="height: 100%;"] > [style="height: 100%; width: 100%; position: relative;"] > [style="height: 100%; width: 100%;"] > .maplibregl-touch-drag-pan > .maplibregl-canvas').as('canvas')
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