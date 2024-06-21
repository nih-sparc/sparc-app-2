import { retryableBefore } from "../support/retryableBefore.js"

const browseCategories = ['dataset', 'model', 'simulation']

/**
 * The number of datasets are displayed per page
 */
const pageLimit = Cypress.env('PAGE_LIMIT')

/**
 * List of keywords
 */
const searchKeywords = [...new Set(Cypress.env('SEARCH_KEYWORDS').split(',').map(item => item.trim()).filter(item => item))]

let filterFacets = []
/**
 * Single facet
 */
const filterFacet = [...new Set(Cypress.env('FILTER_FACET').split(',').map(item => item.trim()).filter(item => item))]
if (filterFacet && filterFacet.length === 1) {
  filterFacets.push(filterFacet)
}
/**
 * List of facets
 */
const multipleFilterFacets = [...new Set(Cypress.env('MULTIPLE_FILTER_FACETS').split(',').map(item => item.trim()).filter(item => item))]
if (multipleFilterFacets && multipleFilterFacets.length > 1) {
  filterFacets.push(multipleFilterFacets)
}

browseCategories.forEach((category) => {

  describe(`Find Data in ${category}`, { testIsolation: false }, function () {
    retryableBefore(function () {
      cy.visitLoadedPage(`/data?type=${category}`)
    })

    // Make sure the page is loaded
    it('Data Browser Page UI', function () {
      // Wait in case the page is still loading
      cy.waitForLoadingMask()

      cy.get('.search-tabs__container').should('be.visible')
      cy.get('.search-bar__container').should('be.visible')
      cy.get('[type="flex"] > :nth-child(1) > .el-row > .el-col-md-8').should('be.visible')
      cy.get('.table-wrap').should('be.visible')
      cy.get(':nth-child(1) > .el-table_1_column_1').should('be.visible')
      cy.get(':nth-child(1) > .el-table_1_column_2 > .cell').should('be.visible')
    })

    describe('All Page Features', { testIsolation: false }, function () {
      beforeEach(function () {
        cy.intercept('**/query?**').as('query')
      })

      /**
       * Test whether the datasets order can be updated correctly
       */
      it('Sort dropdown', function () {
        // Show all datasets in order to check the sorting functionality
        cy.get(':nth-child(1) > p > .el-dropdown > .filter-dropdown').click()
        cy.get('.el-dropdown-menu > .el-dropdown-menu__item:visible').contains('View All').click()

        cy.wait('@query', { timeout: 20000 })
        cy.waitForLoadingMask()

        // Data sorting
        cy.checkDatasetSorted('Date (asc)')

        // A-Z sorting
        cy.get('.label1 > .el-dropdown > .filter-dropdown > .el-dropdown-text-link').click()
        cy.get('.el-dropdown-menu > .el-dropdown-menu__item:visible').contains('A-Z').click()

        cy.wait('@query', { timeout: 20000 })
        cy.waitForLoadingMask()

        cy.checkDatasetSorted('Z-A')
      })

      /**
       * Test whether tooltips can be shown up and content can be displayed correctly
       */
      it('Tooltips', function () {
        // Filter applied
        cy.get('.nuxt-icon.nuxt-icon--fill.help-icon.el-tooltip__trigger.el-tooltip__trigger').trigger('mouseenter', { eventConstructor: 'MouseEvent' })
        cy.get('[role="tooltip"]').should(($tooltip) => {
          // Check for tooltip visibility
          expect($tooltip, 'Tooltip for Filter applied should be visible').to.be.visible
          // Check for tooltip content
          expect($tooltip, 'Tooltip for Filter applied should contain correct content').to.contain('How do filters work?')
          expect($tooltip, 'Tooltip for Filter applied should contain correct content').to.contain('Within categories: OR')
          expect($tooltip, 'Tooltip for Filter applied should contain correct content').to.contain("example: 'heart' OR 'colon'")
          expect($tooltip, 'Tooltip for Filter applied should contain correct content').to.contain('Between categories: AND')
          expect($tooltip, 'Tooltip for Filter applied should contain correct content').to.contain("example: 'rat' AND 'lung'")
        })
        cy.get('.nuxt-icon.nuxt-icon--fill.help-icon.el-tooltip__trigger.el-tooltip__trigger').trigger('mouseleave', { eventConstructor: 'MouseEvent' })
        // Check for tooltip visibility
        cy.get('[role="tooltip"]').should(($tooltip) => {
          expect($tooltip, 'Tooltip for Filter applied should not be visible').to.not.be.visible
        })

        // AVAILABILITY
        cy.get('.ml-4.help-icon').trigger('mouseenter', { eventConstructor: 'MouseEvent' })
        cy.get('[role="tooltip"]').should(($tooltip) => {
          // Check for tooltip visibility
          expect($tooltip, 'Tooltip for AVAILABILITY should be visible').to.be.visible
          // Check for tooltip content
          expect($tooltip, 'Tooltip for AVAILABILITY should contain correct content').to.contain('SPARC datasets are subject to a 1 year embargo during which time')
          expect($tooltip, 'Tooltip for AVAILABILITY should contain correct content').to.contain('the datasets are visible only to members of the SPARC consortium.')
          expect($tooltip, 'Tooltip for AVAILABILITY should contain correct content').to.contain('During embargo, the public will be able to view basic metadata about')
          expect($tooltip, 'Tooltip for AVAILABILITY should contain correct content').to.contain('these datasets as well as their release date.')
        })
        cy.get('.ml-4.help-icon').trigger('mouseleave', { eventConstructor: 'MouseEvent' })
        // Check for tooltip visibility
        cy.get('[role="tooltip"]').should(($tooltip) => {
          expect($tooltip, 'Tooltip for AVAILABILITY should not be visible').to.not.be.visible
        })
      })

      /**
       * Test whether the number of datasets can be displayed correctly
       */
      it('Page Limit', function () {
        // Change the page limit
        cy.get(':nth-child(1) > p > .el-dropdown > .filter-dropdown').click()
        cy.get('.el-dropdown-menu > .el-dropdown-menu__item:visible').contains(pageLimit).click()
        if (pageLimit !== 10 && pageLimit !== 'View All') {
          cy.wait('@query', { timeout: 20000 })
          cy.waitForLoadingMask()
        }

        cy.get('.el-col-md-16 > :nth-child(1) > p').then(($number) => {
          const numberOfDatasets = parseInt($number.text().match(/[0-9]+(.[0-9]+)?/i)[0])
          if (pageLimit === 'View All') {
            // Check for page limit in URL
            cy.url().should(($url) => {
              expect($url, 'URL should contain page limit parameter').to.contain(`limit=${numberOfDatasets}`)
            })
            // Check for the number of displayed datasets
            cy.get('.el-table__row').should(($tableRows) => {
              expect($tableRows, 'All datasets should be displayed').to.have.length(numberOfDatasets)
            })
          } else {
            // Check for page limit in URL
            cy.url().should(($url) => {
              expect($url, 'URL should contain page limit parameter').to.contain(`limit=${pageLimit}`)
            })
            // Check for the number of displayed datasets
            if (numberOfDatasets < pageLimit) {
              cy.get('.el-table__row').should(($tableRows) => {
                expect($tableRows, 'Correct number of datasets should be displayed').to.have.length(numberOfDatasets)
              })
            } else {
              cy.get('.el-table__row').should(($tableRows) => {
                expect($tableRows, 'Number of displayed datasets should be equal to the page limit').to.have.length(pageLimit)
              })
            }
          }
        })
      })
    })

    searchKeywords.forEach((keyword) => {

      it(`Keyword Search - ${keyword}`, function () {
        cy.get('.el-input__inner').should('have.attr', 'placeholder', 'Enter search criteria')

        // Type keyword
        cy.get('.el-input__inner').clear()
        cy.get('.el-input__inner').type(keyword)

        // Check for clear search icon
        cy.get('.nuxt-icon.nuxt-icon--fill.body1.close-icon').should('be.visible')

        // Click search button
        cy.get('.search-text').click()

        cy.waitForLoadingMask()

        // Check for keyword in URL
        cy.url().should('contain', keyword)

        cy.wait('@query', { timeout: 20000 })
        cy.waitForLoadingMask()

        // Check for result
        cy.get(':nth-child(1) > p').then(($result) => {
          if ($result.text().includes(' 0 Results | Showing')) {
            // Empty text should exist if no result
            cy.get('.el-table__empty-text').should('exist').and('have.text', 'No Results')
          } else {
            cy.get('.table-wrap').then(($content) => {
              const keywordExist = $content.text().toLowerCase().includes(keyword.toLowerCase())
              if (keywordExist) {
                // Check for keyword
                cy.wrap($content).contains(new RegExp(keyword, 'i')).should('exist')

                // Check for highlighted keyword
                cy.get('b').contains(new RegExp(keyword, 'i')).should('exist')
              } else {
                // *** Ignore when keyword cannot be found or
                // *** Find some other solutions in the future
              }
            })
          }
        })
        // Clear search input
        cy.get('.nuxt-icon.nuxt-icon--fill.body1.close-icon').click()

        // *** There are situations that dataset cards do not show the (highlighted) keywords
        // *** Just in case this happens for all the displayed dataset cards, extra tests may need to be added
      })
    })

    filterFacets.forEach((facetList) => {

      it(`Faceted Browse Search - ${facetList}`, function () {
        // Check for filters applied box
        cy.get('.no-facets').should('contain', 'No filters applied')

        cy.wait(5000)

        // Expand all filters/facets
        cy.get('.expand-all-container > .el-link > .el-link__inner').click()
        cy.get('.label-content-container').should('be.visible').and('have.length.above', 0)

        // Expand nested facet menu item
        cy.get('.el-icon.el-tree-node__expand-icon:visible').not('.is-leaf').each(($ele) => {
          const isExpanded = $ele.hasClass('expanded')
          if (!isExpanded) cy.wrap($ele).click()
        })

        // Check for filter
        cy.get('.el-tree-node__content > .custom-tree-node > .capitalize:visible').then(($label) => {
          let facetsArray = []
          cy.wrap($label).each($span => facetsArray.push($span.text().toLowerCase())).then(() => {
            let facetIsObserved = true
            facetList.forEach((facet) => {
              facetIsObserved = facetIsObserved && facetsArray.includes(facet.toLowerCase())
            })
            if (facetIsObserved) {
              facetList.forEach((facet) => {
                // Check the matched facet checkbox
                cy.wrap($label).contains(new RegExp(`^${facet}$`, 'i')).then(($label) => {
                  cy.wrap($label).parent().siblings('.el-checkbox').then(($checkbox) => {
                    if (!$checkbox.hasClass('is-checked')) cy.wrap($label).click()
                  })
                })

                // Check for the number of facet tags in filters applied box
                cy.get('.el-card__body > .capitalize:visible').contains(new RegExp(facet, 'i')).should('exist')
              })

              // Check for URL
              cy.url().should('contain', 'selectedFacetIds')

              cy.wait('@query', { timeout: 20000 })
              cy.waitForLoadingMask()

              // Check for result correctness
              cy.get(':nth-child(1) > p').then(($result) => {
                if ($result.text().includes('0 Results | Showing')) {
                  // Empty text should exist if no result
                  cy.get('.el-table__empty-text').should('exist').and('have.text', 'No Results')
                } else {
                  // Check for facets exist in dataset card
                  cy.get('.property-table').then(($content) => {
                    facetList.forEach((facet) => {
                      const facetExistInCard = $content.text().toLowerCase().includes(facet.toLowerCase())
                      if (facetExistInCard) {
                        cy.wrap($content).contains(new RegExp(facet, 'i')).should('exist')
                      } else {
                        // *** Ignore when facets cannot be found or
                        // *** Find some other solutions in the future
                      }
                    })
                  })
                }
              })

              for (let index = 0; index < 2; index++) {
                if (index === 1) {
                  // Combine with search
                  cy.get('.el-input__inner').clear()
                  cy.get('.el-input__inner').type('dataset')
                  cy.filterCheckbox(facetList, 'check', $label)
                }

                // Uncheck all
                cy.filterCheckbox(facetList, 'uncheck', $label)
                cy.checkFilterCleared()

                // Close all tags in order
                cy.filterCheckbox(facetList, 'check', $label)
                facetList.forEach((facet) => {
                  // Check the matched facet checkbox
                  cy.wrap($label).contains(new RegExp(`^${facet}$`, 'i')).then(($label) => {
                    cy.wrap($label).parent().siblings('.el-checkbox').then(($checkbox) => {
                      const isChecked = $checkbox.hasClass('is-checked')
                      const isIndeterminate = $checkbox.children().hasClass('is-indeterminate')
                      // Close all facet tags in filters applied box
                      if (isChecked) cy.get('.el-card__body > .capitalize').contains(new RegExp(`^${facet}$`, 'i')).siblings().click()
                      if (isIndeterminate) {
                        cy.get('.el-card__body > .capitalize > .el-tag__close').each(($close) => {
                          cy.wrap($close).click()
                        })
                      }
                    })
                  })
                })
                cy.checkFilterCleared()

                // Reset all
                cy.filterCheckbox(facetList, 'check', $label)
                cy.get('.tags-container > .flex > .el-link > .el-link__inner').click()
                cy.checkFilterCleared()

                // Close one child facet tag and then click reset all
                cy.filterCheckbox(facetList, 'check', $label)
                cy.get('.el-card__body > .capitalize > .el-tag__close').last().click()
                cy.get('.tags-container > .flex > .el-link > .el-link__inner').click()
                cy.checkFilterCleared()
              }
            } else {
              this.skip()
            }
          })
        })
      })
    })
  })
})