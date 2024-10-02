import { retryableBefore } from "../support/retryableBefore.js"

describe('Homepage', { testIsolation: false }, function () {
  retryableBefore(function () {
    cy.visitLoadedPage('')
  })

  it(`Testing Portal Target: ${Cypress.config().baseUrl}`, function () { })

  it('Navigation Bar', function () {
    // Check for navigation bar
    cy.get('.mobile-navigation > :nth-child(1) > :nth-child(1) > a').should('contain', 'Data & Models').and('have.attr', 'href', '/data?type=dataset')
    cy.get('.mobile-navigation > :nth-child(1) > :nth-child(2) > a').should('contain', 'SPARC Apps').and('have.attr', 'href', '/apps')
    cy.get('.mobile-navigation > :nth-child(1) > :nth-child(3) > a').should('contain', 'Tools & Resources').and('have.attr', 'href', '/tools-and-resources')
    cy.get('.mobile-navigation > :nth-child(1) > :nth-child(4) > a').should('contain', 'News & Events').and('have.attr', 'href', '/news-and-events')
    cy.get(':nth-child(1) > :nth-child(5) > a').should('contain', 'About').and('have.attr', 'href', '/about')
    cy.get(':nth-child(1) > :nth-child(6) > a').should('contain', 'Submit to SPARC').and('have.attr', 'href', '/share-data')
  })

  it('Page hero', function () {
    // Check for page hero
    cy.get('.page-hero').should('exist').within(() => {
      // Check for content title
      cy.get('h1').should('exist').and('contain', 'SPARC')

      // Check for content description
      cy.get('h5').should('exist')

      // Check for content image
      cy.get('[class="page-hero-img"]').should('exist').and('have.prop', 'naturalWidth').should('be.greaterThan', 0)
    })
  })

  it('SPARC by the numbers', function () {
    // Check for content title
    cy.get('.container.p-24 > .heading2').should('exist').and('contain', 'SPARC by the numbers')

    // Check for consortia
    cy.get('.container.p-24 > .body1 > b > .heading2').first().should('exist').then(($el) => {
      const numberOfConsortia = parseInt($el.text())

      cy.get('.container.p-24 > .data-wrap.py-16 > .consortia-item').should('have.length', numberOfConsortia)
      cy.get('.container.p-24 > .data-wrap.py-16 > .consortia-item').should('have.attr', 'href').and('contain', '/about/consortia/')
    })

    // Check for contributor
    cy.get('.container.p-24 > .body1 > b > .heading2').last().should('exist').then(($el) => {
      const numberOfContributor = parseInt($el.text())
      expect(numberOfContributor).to.be.greaterThan(0)

      cy.get('.container.p-24 > .data-wrap.pt-16 > .consortia-item').should('have.length.above', 0)
      cy.get('.container.p-24 > .data-wrap.pt-16 > .consortia-item').should('have.attr', 'href').and('contain', '/data?type=')
    })
  })

  it('Portal features', function () {
    // Check for the number of features
    cy.get('.feature-container').should('have.length', 4)

    // Check for feature card
    cy.get(':nth-child(1) > .feature-container').within(() => {
      cy.get('.icon').should('exist')
      cy.get('.heading2').should('exist')
      cy.get('.body1').should('exist')
      cy.get('.button-link > .el-button > span').should('exist')
    })

    // Check for button link
    cy.get(':nth-child(1) > .feature-container > .button-link').should('contain', 'Data and Models').and('have.attr', 'href', '/data?type=dataset')
    cy.get(':nth-child(2) > .feature-container > .button-link').should('contain', 'Maps').and('have.attr', 'href', '/apps/maps?type=ac')
    cy.get(':nth-child(3) > .feature-container > .button-link').should('contain', 'Discover').and('have.attr', 'href').and('contain', '/tools-and-resources')
    cy.get(':nth-child(4) > .feature-container > .button-link').should('contain', 'Submit').and('have.attr', 'href', '/share-data')
  })

  it('Find by', function () {
    cy.get('.categories-container > .heading2').should('have.text', 'Find by')

    // Check for categories selection item
    cy.get('.categories-container > .categories-select').click()
    cy.get('.el-select-dropdown > .el-scrollbar > .el-select-dropdown__wrap > .el-select-dropdown__list > .el-select-dropdown__item').should('have.length.above', 0)
    cy.get('.categories-container > .categories-select').click()

    cy.wait(5000)

    cy.get('.featured-data > .gallery > .resources-gallery-strip > .card-line > .key-image-span > .data-wrap > .data-item').should('have.attr', 'href').and('contain', '/data?type=dataset&selectedFacetIds=')
    
    // Check for pagination
    cy.get('.sparc-design-system-pagination').should('exist')
    cy.get('.is-active').should('contain', '1')
    cy.get('.btn-next').click()
    cy.get('.is-active').should('contain', '2')
  })

  it('Resources and datasets', function () {
    // Check for content title
    cy.get('.section-container.py-24 > .heading2').should('contain', 'Resources & Datasets')

    // Check for card description
    cy.get('.row > :nth-child(1) > .mb-16').should('contain', 'Here is a resource you might be interested in:')
    cy.get('.row > :nth-child(2) > .mb-16').should('have.text', 'Featured Datasets')

    // Check for card content
    cy.get(':nth-child(1) > .card-container').within(() => {
      cy.get('.subpage-row > :nth-child(1) > .image-container > .banner-image').should('exist')
      cy.get('.subpage-row > :nth-child(2) > .dataset-name').should('exist')
      cy.get('.subpage-row > :nth-child(2) > .dataset-description').should('exist')
      cy.get('.subpage-row > :nth-child(2) > .button-link > .el-button').should('exist')
    })

    // Check for title redirect link
    cy.get(':nth-child(1) > .card-container > .subpage-row > :nth-child(2) > .dataset-name').should('have.attr', 'href').and('contain', '/resources/')
    cy.get(':nth-child(2) > .card-container > .subpage-row > :nth-child(2) > .dataset-name').should('have.attr', 'href').and('contain', '/datasets/')

    // Check for card 'view all' link
    cy.get('.row > :nth-child(1) > .view-all-link').should('contain', 'View All Tools & Resources').and('have.attr', 'href', '/tools-and-resources/tools')
    cy.get(':nth-child(2) > .view-all-link').should('contain', 'View All Datasets').and('have.attr', 'href', '/data?type=dataset')
  })

  it('News and upcoming events', function () {
    // Check for content title
    cy.get('.featured-datasets > .heading2').should('contain', 'News & Upcoming Events')

    // Check for card image
    cy.get('.sparc-card__image').should('exist')

    // Check for card title
    cy.get('h3 > a').should('exist')

    // Check for card subtitle
    cy.get('.markdown-text > p').should('exist')
    cy.get(':nth-child(2) > .el-button').should('contain', 'Learn More')

    // Check for card 'view all' link
    cy.get('.sparc-card__content-wrap__content > .view-all-link').should('contain', 'View All News & Events').and('have.attr', 'href', '/news-and-events')
  })

  it('Stay connected', function () {
    // Check for content title
    cy.get('.subheader').should('have.text', 'Stay Connected')

    // Check for content
    cy.get('.newsletter-wrap > .heading2').should('have.text', 'Sign up for the SPARC Newsletter')
    cy.get('.office-hours-column > .heading2').should('have.text', 'Open Office Hours')
  })

  it('Footer', function () {
    cy.get('.footer__links > :nth-child(1) > :nth-child(1) > h3').should('have.text', 'Learn More')
    cy.get(':nth-child(1) > :nth-child(2) > h3').should('have.text', 'Policies')
    cy.get(':nth-child(2) > :nth-child(1) > h3').should('have.text', 'Help Us Improve')
    cy.get(':nth-child(2) > :nth-child(2) > h3').should('have.text', 'Stay Up-to-Date')
    cy.get('.footer__info--logo > .router-link-active > .logo').should('have.attr', 'alt').and('contain', 'Logo for SPARC')
    cy.get('.footer__info--blurb > p').should('contain', 'The open community platform for bridging the body and the brain through neuroscience and systems physiology data, computational and spatial modeling, and device design.')
  })
})
