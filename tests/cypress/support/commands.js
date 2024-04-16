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
  // // For legacy dataset
  // if (err.message.includes('ObjectID does not exist'))
  //   return false
  return true
})

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

Cypress.Commands.add('clickNeuron', (coordinate, pixel) => {
  let coorX = coordinate.x
  let coorY = coordinate.y
  const clickNeuron = () => {
    /**
     * ==================================================================
     * Below is used to avoid the tooltip not display for the first click
     * Can be removed if the popup logic updated
     */
    cy.get('@canvas').click(coorX, coorY)

    cy.wait(5000)

    cy.get('body').then(($body) => {
      if ($body.find('.maplibregl-popup-close-button').length > 0) {
        // Close the provenance card
        cy.get('.maplibregl-popup-close-button').click({ force: true })
      }
    })
    /**
     * ==================================================================
     */

    cy.get('@canvas').click(coorX, coorY)

    cy.wait(5000)

    cy.get('body').then(($body) => {
      if ($body.find('.maplibregl-popup-close-button').length > 0) {
        cy.wrap($body).find('.maplibregl-popup-content > .tooltip-container > .main', { timeout: 30000 }).within(() => {

          // Check for the popover provenance card content
          cy.get('.title').should('exist')
          cy.get('.subtitle').should('exist')
          cy.get('.content-container').should('not.be.visible')
          cy.get(':nth-child(3):visible').click()
          cy.get('.content-container').should('be.visible')
        })
        // Close the provenance card
        cy.get('.maplibregl-popup-close-button').click({ force: true })
      } else {
        coorX -= pixel
        clickNeuron()
      }
    })
  }
  clickNeuron()
})