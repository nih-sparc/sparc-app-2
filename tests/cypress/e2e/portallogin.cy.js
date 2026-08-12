import { retryableBefore } from '../support/utils.js'

describe('Portal Login', { testIsolation: false }, function () {

    retryableBefore(function () {
        cy.visit('/data?type=dataset')
        cy.waitForPageLoading()
    })

    describe('When NOT logged in', { testIsolation: false }, function () {
        it.skip('Access embargoed dataset', function () { })

        it.skip('Describe workflow', function () { })

        it('Portal submissions form', function () {
            // "Contact Us" is now "Support", nested in the Access dropdown, and is an internal link (no more target=_blank).
            // Hover (not click) - the dropdown opens on mouseenter, and clicking the already-open button toggles it back closed.
            cy.contains('.nav-item', 'Access').trigger('mouseenter')
            cy.get('.nav-item.open').contains('.dd-link-title', 'Support').closest('.dd-link').invoke('attr', 'href').then((href) => {
                expect(href).to.contain('/contact-us')
                cy.visit(href)
                cy.waitForPageLoading()
                cy.get('.el-form-item > .el-form-item__label').as('formItems')
                cy.get('@formItems').contains(/First Name/i).siblings().click()
                cy.get('@formItems').contains(/Last Name/i).siblings().click()
                cy.get('@formItems').contains("Email").siblings().click()
                cy.get('@formItems').contains(/First Name/i).siblings().click()
                cy.get('.el-form-item__content > .el-form-item__error').should(($message) => {
                    expect($message, 'Error message should exist').to.have.length(3)
                    expect($message, 'First Name input should be empty').to.contain('Please enter your first name')
                    expect($message, 'Last Name input should be empty').to.contain('Please enter your last name')
                    expect($message, 'Email input should be empty').to.contain('Please enter your email')
                })
            })
        })
    })
})