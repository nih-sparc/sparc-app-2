/**
 * SimulationVuer (libOpenCOR wasm) needs SharedArrayBuffer,
 * which is only available on cross-origin isolated pages (COOP + COEP).
 * Safari/WebKit does not support COEP `credentialless`, so it must get `require-corp`,
 * and cross-origin images on those pages must be loaded in CORS mode (crossorigin="anonymous").
 *
 * Cypress runs the app inside an iframe, so the page can't be cross-origin isolated here.
 * These tests check the server headers and image attributes instead.
 * The real simulation run is covered by the Playwright test in tests/playwright.
 */
import { retryableBefore } from '../support/utils.js'

const userAgents = {
  'macOS Safari': 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/18.0 Safari/605.1.15',
  'iOS Safari': 'Mozilla/5.0 (iPhone; CPU iPhone OS 18_0 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/18.0 Mobile/15E148 Safari/604.1',
  'iOS Chrome': 'Mozilla/5.0 (iPhone; CPU iPhone OS 18_0 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) CriOS/130.0.6723.90 Mobile/15E148 Safari/604.1',
  'Chrome': 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/130.0.0.0 Safari/537.36',
  'Edge': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/130.0.0.0 Safari/537.36 Edg/130.0.0.0',
  'Firefox': 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10.15; rv:131.0) Gecko/20100101 Firefox/131.0',
}

const expectedCoep = {
  'macOS Safari': 'require-corp',
  'iOS Safari': 'require-corp',
  'iOS Chrome': 'require-corp',
  'Chrome': 'credentialless',
  'Edge': 'credentialless',
  'Firefox': 'credentialless',
}

const simulationFileUrl = Cypress.env('SIMULATION_FILE_URL')
const isolatedRoutes = ['/apps/maps', simulationFileUrl].filter(Boolean)

describe('Cross-origin isolation headers', function () {

  isolatedRoutes.forEach((route) => {
    Object.entries(userAgents).forEach(([browser, userAgent]) => {
      it(`${route} sends COEP ${expectedCoep[browser]} to ${browser}`, function () {
        cy.request({ url: route, headers: { 'user-agent': userAgent } }).then((response) => {
          expect(response.headers['cross-origin-opener-policy'], 'COOP').to.equal('same-origin')
          expect(response.headers['cross-origin-embedder-policy'], 'COEP').to.equal(expectedCoep[browser])
        })
      })
    })
  })

  it('does not send COEP on routes without a simulation viewer', function () {
    cy.request({ url: '/', headers: { 'user-agent': userAgents['macOS Safari'] } }).then((response) => {
      expect(response.headers, 'COEP').to.not.have.property('cross-origin-embedder-policy')
    })
  })
})

describe('Cross-origin images on the maps page', { testIsolation: false }, function () {

  retryableBefore(function () {
    cy.visit('/apps/maps?type=ac')
  })

  it('Sidebar dataset images are loaded in CORS mode', function () {
    cy.waitForViewerContainer('.mapClass')
    cy.waitForPageLoading()
    cy.waitForMapLoading()

    // Open the sidebar on the dataset explorer
    cy.get('body').then(($body) => {
      if ($body.find('.open-tab > .el-icon').length !== 0) {
        cy.get('.open-tab > .el-icon').click()
      }
    })
    cy.get('.tabs-container > :nth-child(1) > .tab-title').click()
    cy.get('.dataset-card-container > .dataset-card', { timeout: 30000 }).should('have.length.greaterThan', 0)

    // With COEP require-corp (Safari), cross-origin images without CORS mode are blocked
    cy.get('.dataset-card img', { timeout: 30000 }).should(($images) => {
      const crossOriginImages = $images.toArray().filter((img) => {
        const src = img.getAttribute('src') || ''
        return /^https?:/.test(src) && new URL(src).origin !== new URL(Cypress.config('baseUrl')).origin
      })
      expect(crossOriginImages.length, 'Cross-origin dataset images').to.be.greaterThan(0)
      crossOriginImages.forEach((img) => {
        expect(img.getAttribute('crossorigin'), `crossorigin on ${img.getAttribute('src')}`).to.equal('anonymous')
      })
    })
  })
})
