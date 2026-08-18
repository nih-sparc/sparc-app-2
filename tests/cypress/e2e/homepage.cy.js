import { retryableBefore } from "../support/utils.js"

describe('Homepage', { testIsolation: false }, function () {

  retryableBefore(function () {
    cy.visit('')
    cy.waitForPageLoading()
  })

  it.skip(`Portal Target: ${Cypress.config().baseUrl}`, function () { })

  it('Navigation Bar', function () {
    // Dropdowns open on hover, not click - clicking an already-open nav-btn toggles it closed again.
    const dropdowns = [
      { label: 'Access', linkTitle: 'Datasets & models', href: '/data?type=dataset' },
      { label: 'Contribute', linkTitle: 'Submit data', href: '/share-data' },
      { label: 'Community', linkTitle: 'About the DRC', href: '/about' },
      { label: 'Tools', linkTitle: 'Explore', href: '/tools-and-resources' },
    ]
    dropdowns.forEach(({ label, linkTitle, href }) => {
      cy.contains('.nav-item', label).trigger('mouseenter')
      cy.get('.nav-item.open').contains('.dd-link-title', linkTitle).closest('.dd-link').should(($link) => {
        expect($link, `"${label}" dropdown should have a "${linkTitle}" link with correct href`).to.have.attr('href').to.contain(href)
      })
    })
  })

  it('Hero', function () {
    cy.get('.home-hero').within(() => {
      cy.get('.hero-eyebrow').should('have.text', 'Open data from molecule to system')
      cy.get('.hero-h1').should(($title) => {
        expect($title, 'Hero should have a non-empty title').to.not.be.empty
      })
      cy.get('.hero-sub').should(($sub) => {
        expect($sub, 'Hero should have a non-empty description').to.not.be.empty
      })
      cy.get('.hero-image').should(($image) => {
        expect($image, 'Hero image should be displayed').to.have.prop('naturalWidth').to.be.greaterThan(0)
      })
      cy.get('.hero-btn-primary').should(($btn) => {
        expect($btn, 'Primary hero button should have correct text').to.contain('Access')
        expect($btn, 'Primary hero button should have correct href').to.have.attr('href', '/data?type=dataset')
      })
      cy.get('.hero-btn-ghost').should(($btn) => {
        expect($btn, 'Ghost hero button should have correct text').to.contain('Contribute')
        expect($btn, 'Ghost hero button should have correct href').to.have.attr('href', '/share-data')
      })
    })
  })

  it('Interactive map section', function () {
    cy.get('.map-section').within(() => {
      cy.get('.section-kicker').should('contain', 'Interactive map')
      cy.get('.section-h2').should('contain', "Navigate the body's wiring diagram")
      cy.get('.navigator-video').should(($video) => {
        expect($video, 'Map video should have a source').to.have.attr('src').and.not.be.empty
      })
      cy.get('.map-open-hint').should(($link) => {
        expect($link, 'Map link should have correct text').to.contain('Open full map')
        expect($link, 'Map link should have correct href').to.have.attr('href', '/apps/maps')
      })
    })
  })

  it('Discover by topic', function () {
    cy.get('.discover-section').within(() => {
      cy.get('.section-h2').should('contain', 'Discover by topic')
      // Check for the 4 facet tabs
      cy.get('.facet-tab-pill').should('have.length', 4)
      cy.get('.facet-tab-pill').first().should('have.class', 'active')
      // Switching tabs updates which one is active
      cy.get('.facet-tab-pill').eq(1).click().should('have.class', 'active')
      cy.get('.facet-tab-pill').first().should('not.have.class', 'active')
    })
    // The visible chart for the active tab should have rendered bars (live Algolia facet data)
    cy.get('.discover-section .facet-chart:not(.facet-chart--hidden) .facet-bar-row').should(($rows) => {
      expect($rows, 'At least one facet bar should be displayed').to.have.length.greaterThan(0)
    })
    // Clicking a real facet bar (not the "Total" bar) routes to the filtered data page
    cy.get('.discover-section .facet-chart:not(.facet-chart--hidden) .facet-bar-row')
      .not('.facet-bar-row--show-all').first().click()
    cy.location('pathname').should('eq', '/data')
    cy.location('search').should('include', 'selectedFacetIds=')
  })

  it('From Data to Discovery', function () {
    // Previous test navigated away to /data - come back to the homepage
    cy.visit('')
    cy.waitForPageLoading()
    cy.get('.tools-section').within(() => {
      cy.get('.section-h2').should('contain', 'From Data to Discovery')
      cy.get('.tool-tab').should('have.length', 5)
      cy.get('.tool-tab').first().should('have.class', 'active')
    })
    cy.get('.tools-section .tool-tab').eq(1).click().should('have.class', 'active')
    cy.get('.tools-preview').not('.tools-preview--hidden').should(($preview) => {
      expect($preview, 'Exactly one tool preview should be visible').to.have.length(1)
      expect($preview.find('.preview-heading'), 'Visible preview should have a heading').to.not.be.empty
    })
    cy.get('.tools-preview').not('.tools-preview--hidden').find('.preview-btn').should('have.attr', 'href')
  })

  it('Join the exchange', function () {
    cy.get('.path-section').within(() => {
      cy.get('.section-h2').should('contain', 'Join the exchange')
      cy.get('.path-card').should('have.length', 3)
    })
    cy.get('.path-card').eq(0).should(($card) => {
      expect($card, 'First path card should be "Use data"').to.contain('Use data')
      expect($card.find('.path-card-btn'), 'Use data card should link to API docs').to.have.attr('href').and.contain('docs.sparc.science')
    })
    cy.get('.path-card').eq(1).should(($card) => {
      expect($card, 'Second path card should be "Share your data"').to.contain('Share your data')
      expect($card.find('.path-card-btn'), 'Share your data card should link to share-data').to.have.attr('href', '/share-data')
    })
    cy.get('.path-card').eq(2).should(($card) => {
      expect($card, 'Third path card should be "News"').to.contain('News')
      expect($card.find('.path-card-btn'), 'News card should link to news-and-events').to.have.attr('href', '/news-and-events')
    })
  })

  it('Footer', function () {
    cy.get('.footer__links > :nth-child(1) > :nth-child(1) > h3').should(($text) => {
      expect($text, 'Footer should have correct text').to.contain('Learn More')
    })
    cy.get(':nth-child(1) > :nth-child(2) > h3').should(($text) => {
      expect($text, 'Footer should have correct text').to.contain('Policies')
    })
    cy.get(':nth-child(2) > :nth-child(1) > h3').should(($text) => {
      expect($text, 'Footer should have correct text').to.contain('Help Us Improve')
    })
    cy.get(':nth-child(2) > :nth-child(2) > h3').should(($text) => {
      expect($text, 'Footer should have correct text').to.contain('Stay Up-to-Date')
    })
    cy.get('.footer__info--logo > .router-link-active > .logo').should(($logo) => {
      expect($logo, 'Footer should have correct logo').to.have.attr('alt').to.contain('Logo for SPARC')
    })
    cy.get('.footer__info--blurb > p').should(($text) => {
      expect($text, 'Footer should have correct text').to.contain('The open community platform for bridging the body and the brain through neuroscience and systems physiology data, computational and spatial modeling, and device design.')
    })
  })
})
