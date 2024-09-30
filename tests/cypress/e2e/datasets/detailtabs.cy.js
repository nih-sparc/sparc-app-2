import { retryableBefore, stringToArray } from '../../support/utils.js'

/**
 * List of dataset ids
 */
const datasetIds = stringToArray(Cypress.env('DATASET_IDS'), ',')

datasetIds.forEach((datasetId) => {

  describe(`Dataset ${datasetId}`, { testIsolation: false }, function () {

    retryableBefore(function () {
      cy.visit(`/datasets/${datasetId}?type=dataset`)
    })

    beforeEach(function () {
      cy.intercept('**/download?**').as('download')
      cy.intercept('**/zipit/**').as('zipit')
      cy.waitForPageLoading()
    })

    describe('Abstract Tab', { testIsolation: false }, function () {

      beforeEach(function () {
        cy.clickOnDetailTab('Abstract').then((tab) => {
          if (!tab) {
            this.skip()
          }
        })
      })

      it('Content', function () {
        cy.get('.dataset-description-info strong').then(($description) => {
          const description = $description.text()
          // The following regular expression should capture space and letters
          cy.wrap($description).contains(/Study Purpose/i).parent().should(($content) => {
            expect($content.text().trim(), '"Study Purpose" content should exist').to.match(/Study Purpose:(.+?)/i)
          })
          cy.wrap($description).contains(/Data Collect(ion|ed)/i).parent().should(($content) => {
            expect($content.text().trim(), '"Data Collection" content should exist').to.match(/Data Collect(ion|ed):(.+)/i)
          })
          cy.wrap($description).contains(/(Primary )?Conclusion(s)?/i).parent().should(($content) => {
            expect($content.text().trim(), '"Primary Conclusions" content should exist').to.match(/(Primary )?Conclusion(s)?:(.+)/i)
          })
          // Check for Curator's Note
          cy.wrap($description).contains(/Experimental Design/i).parent().should(($content) => {
            expect($content.text().trim(), '"Experimental Design" content should exist').to.match(/Experimental Design:(.+)/i)
          })
          cy.wrap($description).contains(/Completeness/i).parent().should(($content) => {
            expect($content.text().trim(), '"Completeness" content should exist').to.match(/Completeness:(.+)/i)
          })
          cy.wrap($description).contains(/Subjects & Samples/i).parent().should(($content) => {
            expect($content.text().trim(), '"Subjects & Samples" content should exist').to.match(/Subjects & Samples:(.+)/i)
          })
          if (description.match(/Primary vs(.)? derivative data/i)) {
            cy.wrap($description).contains(/Primary vs(.)? derivative data/i).parent().should(($content) => {
              expect($content.text().trim(), '"Primary vs derivative data" content should exist').to.match(/Primary vs(.)? derivative data:(.+)/i)
            })
          }
          if (description.match(/Code Availability/i)) {
            cy.wrap($description).contains(/Code Availability/i).parent().should(($content) => {
              expect($content.text().trim(), '"Code Availability" content should exist').to.match(/Code Availability:(.+)/i)
            })
          }
          cy.wrap($description).contains(/Experimental Approach/i).parent().should(($content) => {
            expect($content.text().trim(), '"Experimental Approach" content should exist').to.match(/Experimental Approach:(.+)/i)
          })
          // Check for Subject Information
          cy.wrap($description).contains(/Subject Information/i).should(($content) => {
            expect($content.text().trim(), '"Subject Information" content should exist').to.exist
          })
          cy.wrap($description).contains(/Anatomical structure/i).parent().should(($content) => {
            expect($content.text().trim(), '"Anatomical structure" content should exist').to.match(/Anatomical structure:(.+)/i)
          })
          cy.wrap($description).contains(/Species/i).parent().should(($content) => {
            expect($content.text().trim(), '"Species" content should exist').to.match(/Species:(.+)/i)
          })
          cy.wrap($description).contains(/Sex/i).parent().should(($content) => {
            expect($content.text().trim(), '"Sex" content should exist').to.match(/Sex:(.+)/i)
          })
          cy.wrap($description).contains(/Age Range/i).parent().should(($content) => {
            expect($content.text().trim(), '"Age Range" content should exist').to.match(/Age Range:(.+)/i)
          })
          cy.wrap($description).contains(/Number of samples/i).parent().should(($content) => {
            expect($content.text().trim(), '"Number of samples" content should exist').to.match(/Number of samples:(.+)/i)
          })
        })
        // Check for Keywords
        cy.get('.keywords').should(($content) => {
          expect($content.length, '"Keywords" content should exist').to.be.greaterThan(0)
        })
      })

      it('Download', function () {
        // Check for downloading feature
        cy.get('.dataset-description-info a').not('.link2').last().as('download')
        cy.get('@download').should(($link) => {
          expect($link, 'Download link should exist').to.exist
          expect($link, 'Download link should have correct href').to.have.attr('href').to.match(/https:\/\/api.pennsieve.io\/discover\/datasets\/[0-9]+\/versions\/[0-9]+\/metadata/i)
        })
        cy.get('@download').invoke('attr', 'href').then((href) => {
          cy.request(href).then((resp) => {
            expect(resp.status).to.eq(200)
          })
        })
      })

      it('Protocol Link', function () {
        cy.get('.el-col-sm-16 > .heading2').then(($title) => {
          const title = $title.text().trim()
          const titleRegex = new RegExp('\(' + title + '\)', 'gi')
          cy.get('.dataset-owners').then(($contributor) => {
            const contributor = $contributor.text().replace(/Contributors:/i, '').split(',').map(name => name.trim())
            const contributorReversed = contributor.map(name => name.split(' ').reverse().join(' '))
            const contributorRegex = new RegExp('\(' + contributor.join('|') + '|' + contributorReversed.join('|') + '\)', 'gi')
            cy.get('.dataset-description-info strong').contains(/Protocol Links/i).parents('.experimental-design-container').within(($content) => {
              if ($content.text().includes('https://doi.org/')) {
                cy.get('.link2').as('links')
                cy.get('@links').should(($links) => {
                  expect($links.length, 'Link should have at lease one').to.be.greaterThan(0)
                })
                cy.get('@links').each(($link) => {
                  cy.wrap($link).invoke('attr', 'href').then((href) => {
                    cy.request(href).then((resp) => {
                      expect(resp.status).to.eq(200)
                      const matchTitle = resp.body.match(titleRegex)
                      const matchContributor = resp.body.match(contributorRegex)
                      const matchContent = (matchTitle && matchTitle.length > 0) || (matchContributor && matchContributor.length > 0)
                      expect(matchContent, 'Protocol link should make sense').to.be.true
                    })
                  })
                })
              }
            })
          })
        })
      })
    })

    describe('About Tab', { testIsolation: false }, function () {

      beforeEach(function () {
        cy.clickOnDetailTab('About').then((tab) => {
          if (!tab) {
            this.skip()
          }
        })
      })

      it('Content', function () {
        // Check for content
        cy.get('.dataset-about-info .label4').contains(/Title/i).parent().should(($content) => {
          expect($content.text().trim(), '"Title" content should exist').to.match(/Title:(.+)/i)
        })
        cy.get('.dataset-about-info .label4').contains(/First Published/i).parent().should(($content) => {
          expect($content.text().trim(), '"First Published" content should exist').to.match(/First Published:(.+)/i)
        })
        cy.get('.dataset-about-info .label4').contains(/Last Published/i).parent().should(($content) => {
          expect($content.text().trim(), '"Last Published" content should exist').to.match(/Last Published:(.+)/i)
        })
        cy.get('.dataset-about-info .label4').contains(/Contact Author/i).parent().should(($content) => {
          expect($content.text().trim(), '"Contact Author" content should exist').to.match(/Contact Author:(.+)/i)
        })
        cy.get('.dataset-about-info .label4').contains(/Award[(]s[)]/i).parent().as('awards')
        cy.get('@awards').should(($content) => {
          expect($content.text().trim(), '"Awards" content should exist').to.match(/Award[(]s[)]:(.+)/i)
        })
        cy.get('@awards').find('a').should(($award) => {
          expect($award, 'Award href should exist').to.have.attr('href').to.contain('/about/projects/')
        })
        cy.get('.dataset-about-info .label4').contains(/Funding Program[(]s[)]/i).parent().should(($content) => {
          expect($content.text().trim(), '"Funding Programs" content should exist').to.match(/Funding Program[(]s[)]:(.+)/i)
        })
        cy.get('.dataset-about-info .label4').contains(/Associated project[(]s[)]/i).parent().should(($content) => {
          expect($content.text().trim(), '"Associated projects" content should exist').to.match(/Associated project[(]s[)]:(.+)/i)
        })
        cy.get('.dataset-about-info .label4').contains(/Institution[(]s[)]/i).parent().should(($content) => {
          expect($content.text().trim(), '"Institutions" content should exist').to.match(/Institution[(]s[)]:(.+)/i)
        })
        cy.get('.dataset-about-info .label4').contains(/Version [0-9]+ Revision [0-9]+/i).parent().should(($content) => {
          expect($content.text().trim(), '"Version" content should exist').to.match(/Version [0-9]+ Revision [0-9]+:(.+)/i)
        })
        cy.get('.dataset-about-info .label4').contains(/Dataset DOI/i).parent().should(($content) => {
          expect($content.text().trim(), '"Dataset DOI" content should exist').to.match(/Dataset DOI:(.+)/i)
        })
      })

      it('Contact Author', function () {
        cy.get('.dataset-about-info .label4').contains(/Contact Author/i).parent().as('contact')
        // Check for author and email href
        cy.get('@contact').then(($content) => {
          cy.get('.el-col-sm-16 > .heading2').then(($title) => {
            cy.get('.similar-datasets-container > .px-8').then(($similar) => {
              if ($similar.text().includes('Type:')) {
                cy.wrap($similar).contains(/TYPE/i).siblings('.facet-button-container').click()
                cy.get('.el-input__inner').clear()
                cy.get('.el-input__inner').type(datasetId)
                cy.get('.search-text').click()
                cy.get(':nth-child(1) > p > .el-dropdown > .filter-dropdown').click()
                cy.get('.el-dropdown-menu > .el-dropdown-menu__item:visible').contains('View All').click()
                cy.waitForBrowserLoading()
                cy.get('.cell').contains($title.text()).siblings('.property-table').contains(/Principal Investigator/i).siblings().as('PI')
                cy.get('@PI').then(($pi) => {
                  const author = $content.text().normalize('NFD').replace(/[\u0300-\u036f]/g, '')
                  const pi = $pi.text().normalize('NFD').replace(/[\u0300-\u036f]/g, '')
                  expect(author, 'PI should be the contact author').to.contain(pi)
                  cy.backToDetailPage(datasetId)
                })
              }
            })
          })
          cy.get('.about-section-container a').then(($email) => {
            const author = $content.text().replace($email.text(), '').replace('Contact Author:', '').replace(/[ ]+/g, ' ').trim()
            const name = author.normalize('NFD').replace(/[\u0300-\u036f]/g, '')
            const nameReversed = name.split(' ').reverse().join(' ')
            const nameRegex = new RegExp('\(' + name + '|' + nameReversed + '\)', 'i')
            cy.get('.dataset-owners').should(($contributors) => {
              const contributors = $contributors.text().normalize('NFD').replace(/[\u0300-\u036f]/g, '')
              expect(contributors, 'Contact author should be in contributor list').to.match(nameRegex)
            })
            expect($email, 'Email link should exist').to.have.attr('href').to.contain(`mailto:${$email.text()}`)
          })
        })
      })

      it('Project', function () {
        cy.get('.dataset-about-info .label4').contains(/Award[(]s[)]/i).parent().as('awards')
        cy.get('.dataset-about-info .label4').contains(/Associated project[(]s[)]/i).parent().as('project')
        cy.get('.dataset-about-info .label4').contains(/Institution[(]s[)]/i).parent().as('institutions')
        cy.get('@awards').then(($award) => {
          const award = $award.text().replace(/Award(s):/i, '').trim()
          cy.get('@project').then(($project) => {
            const project = $project.text().replace(/Associated project(s):/i, '').trim()
            cy.get('@institutions').then(($institution) => {
              const institution = $institution.text().replace(/Institution(s):/i, '').trim()
              cy.wrap($project).find('a').click()
              cy.waitForPageLoading()
              cy.get('.row > .heading2').should(($title) => {
                expect($title, 'Project title should be the same').to.contain(project)
              })
              cy.get('span.label4').parent().contains(/INSTITUTION[(]S[)]/i).should(($institution) => {
                expect($institution, 'Institution should be the same').to.contain(institution)
              })
              cy.get('.link1').should(($award) => {
                expect(award, 'Award should be the same').to.include($award.text().trim())
              })
              cy.backToDetailPage(datasetId)
            })
          })
        })
      })
    })

    describe('Cite Tab', { testIsolation: false }, function () {

      beforeEach(function () {
        cy.clickOnDetailTab('Cite').then((tab) => {
          if (!tab) {
            this.skip()
          }
        })
      })

      it('Content', function () {
        cy.get('.info-citation').should(($citation) => {
          expect($citation, 'Citation should exist').to.exist
          expect($citation.length, 'Cite should have multiple citation formats').to.be.greaterThan(0)
        })
        // Check for title
        cy.get('.el-col-sm-16 > .heading2').then(($title) => {
          cy.get('.info-citation > .citation-text', { timeout: 30000 }).should(($citation) => {
            expect($citation, 'Citation should contain title').to.contain($title.text().trim())
          })
        })
      })

      it('DOI', function () {
        // Check for citation doi
        cy.get('.dataset-information-box > :nth-child(2) > a > u').then(($doi) => {
          const doi = $doi.text()
          cy.get('.info-citation > .citation-text', { timeout: 30000 }).should(($citation) => {
            expect($citation, 'Citation should contain doi').to.contain(doi)
          })
          // Check for source link
          cy.get('.citation-details > p > a').then(($link) => {
            expect($link, 'Link should open a new tab').to.have.attr('target').to.contain('blank')
            cy.wrap($link).invoke('attr', 'href').then((href) => {
              expect(href, 'Link should have correct href').to.contain(`https://citation.crosscite.org/?doi=${doi}`)
              cy.request(href).then((resp) => {
                expect(resp.status).to.eq(200)
              })
            })
          })
        })
      })
    })

    describe('Files Tab', { testIsolation: false }, function () {

      beforeEach(function () {
        cy.clickOnDetailTab('Files').then((tab) => {
          if (!tab) {
            this.skip()
          }
        })
      })

      it('Content', function () {
        // Check for direct download content
        cy.get('.left-column .label4').should(($option) => {
          expect($option, 'Option 1 should be Direct download').to.contain('Direct download')
        })
        // Check for download full dataset button
        cy.get('.left-column .el-button').contains('Download Full Dataset').should(($button) => {
          expect($button, 'Download button should exist').to.exist
        })
        // Check for aws download content
        cy.get('.aws-download-column .label4').should(($option) => {
          expect($option, 'Option 2 should be AWS download').to.contain('AWS S3')
        })
      })

      it('Link', function () {
        cy.get('.aws-download-column > :nth-child(1) > a').should(($link) => {
          expect($link, 'AWS pricing link should have correct href').to.have.attr('href').to.contain('https://aws.amazon.com/s3/pricing/')
          expect($link, 'AWS pricing link should open a new tab').to.have.attr('target').to.contain('blank')
        })
        cy.get('.aws-download-column > :nth-child(3) > a').should(($link) => {
          expect($link, 'Help page link should have correct href').to.have.attr('href').to.contain('https://docs.sparc.science/docs/accessing-public-datasets')
          expect($link, 'Help page link should open a new tab').to.have.attr('target').to.contain('blank')
        })
      })

      it('Download', function () {
        cy.get('.mb-8 .label4:visible').contains(/Dataset size/i).parent().then(($size) => {
          const size = parseFloat($size.text().match(/[0-9]+(.[0-9]+)?/i)[0])
          if (($size.text().includes('GB') && size > 5) || $size.text().includes('TB')) {
            cy.get('.el-tooltip__trigger > .el-button').should(($button) => {
              expect($button, 'Download button should be disabled when size is greater than 5GB').to.be.disabled
            })
          } else {
            cy.get('.left-column > :nth-child(1) > a > .el-button').should(($button) => {
              expect($button, 'Download button should be enabled when size is less than 5GB').to.be.enabled
            })
            if ($size.text().includes('MB')) {
              // Check if datasets is downloaded
              cy.get('.left-column > :nth-child(1) > a > .el-button').click()
              cy.wait('@download', { timeout: 20000 }).then((intercept) => {
                expect(intercept.response.statusCode).to.eq(200)
              })
            } else {
              cy.get('.left-column > :nth-child(1) > a').invoke('attr', 'href').then((href) => {
                cy.get('.dataset-information-box > :nth-child(1)').then(($version) => {
                  const versionNumber = $version.text().match(/[0-9]+/i)[0]
                  expect(href, 'Download link should have correct href').to.contain(`https://api.pennsieve.io/discover/datasets/${datasetId}/versions/${versionNumber}/download?downloadOrigin=SPARC`)
                })
              })
            }
          }
        })
      })

      it('File Browser', function () {
        // Check for icon actions
        cy.contains('.el-table__row', 'dataset_description.xlsx').as('datasetDescription')
        cy.get('@datasetDescription').should(($xlsx) => {
          expect($xlsx, 'Dataset description file should exist').to.exist
        })
        // There should be 4 icons
        cy.get('@datasetDescription').find('.nuxt-icon.nuxt-icon--fill.action-icon').as('actions')
        cy.get('@actions').should(($icons) => {
          expect($icons, 'There should be 4 icons').to.have.length(4)
        })
        // Check download
        cy.get('@actions').eq(0).click({ force: true })
        cy.wait('@zipit', { timeout: 20000 }).then((intercept) => {
          expect(intercept.response.statusCode).to.eq(200)
        })
        // Check oSPARC
        cy.get('@actions').eq(2).click({ force: true })
        cy.get('.el-select__wrapper').should(($select) => {
          expect($select, 'Select box should exist').to.exist
        })
        cy.get('.content-body > .el-button').should(($button) => {
          expect($button, 'Open in oSPARC button should exist').to.exist
        })
        cy.get('.el-dialog__headerbtn').click()
        // Check get share links  
        cy.get('@actions').eq(3).click({ force: true })
        cy.get('.el-message', { timeout: 30000 }).should(($message) => {
          expect($message, 'Message should be visible').to.be.visible
        })
        cy.get('.dataset-link').should(($link) => {
          expect($link, 'Navigation help link should exist').to.have.attr('href').to.contain('https://docs.sparc.science/docs/navigating-a-sparc-dataset')
          expect($link, 'Navigation help link should open a new tab').to.have.attr('target').to.contain('blank')
        })
        cy.get('.breadcrumb-link').should('have.class', 'breadcrumb-link')
        cy.get('.breadcrumb-link').should(($link) => {
          expect($link, 'Breadcrumb link should exist').to.exist
          expect($link, 'Breadcrumb link should have correct href').to.have.attr('href').to.contain(`/datasets/${datasetId}?type=dataset&datasetDetailsTab=files&path=files`)
        })
        cy.get('.cell > .file-name-wrap > .el-tooltip__trigger').then(($folder) => {
          cy.get('.breadcrumb-link').should(($breadcrumb) => {
            expect($breadcrumb, 'Should have one breadcrumb').to.have.length(1)
          })
          cy.wrap($folder).first().click()
          cy.get('.breadcrumb-link').should(($breadcrumb) => {
            expect($breadcrumb, 'Should have two breadcrumb').to.have.length(2)
          })
          cy.get(':nth-child(1) > .breadcrumb-link').click()
          cy.get('.breadcrumb-link').should(($breadcrumb) => {
            expect($breadcrumb, 'Should have one breadcrumb').to.have.length(1)
          })
        })
      })
    })

    describe('Gallery Tab', { testIsolation: false }, function () {

      beforeEach(function () {
        cy.clickOnDetailTab('Gallery').then((tab) => {
          if (!tab) {
            this.skip()
          }
        })
      })

      it('Gallery', function () { })
    })

    describe('References Tab', { testIsolation: false }, function () {

      beforeEach(function () {
        cy.clickOnDetailTab('References').then((tab) => {
          if (!tab) {
            this.skip()
          }
        })
      })

      it('Content', function () {
        // Check for consistency between citation and dataset information
        cy.get('.el-col-sm-16 > .heading2').then(($title) => {
          const title = $title.text().match(/[a-z]{3,}/gi)
          cy.get('.el-col-sm-16').contains(/Description/i).parent().then(($description) => {
            const description = $description.text().replace(/Description:/i, '').match(/[a-z]{3,}/gi)
            cy.get('.dataset-references .citation-container').then(($citation) => {
              const regex = new RegExp('\(' + title.concat(description).join('|') + '\)', 'gi')
              const matchText = $citation.text().match(regex)
              const matchContent = matchText && matchText.length > 0
              expect(matchContent, 'Citation content should be consistent with dataset information').to.be.true
            })
          })
        })
        // Check if redundant doi exist
        let doiList = []
        cy.get('.dataset-references').then(($content) => {
          if (
            $content.text().includes('Primary Publications for this Dataset') &&
            $content.text().includes('Preprints')
          ) {
            cy.get('.dataset-references .citation-container > div > a').each($doi => {
              cy.wrap($doi).invoke('attr', 'href').then((href) => {
                if (!doiList.includes(href)) {
                  doiList.push(href)
                } else {
                  cy.print({
                    title: 'doi',
                    message: 'Redundant doi references are found',
                    type: 'warning'
                  })
                }
              })
            })
          }
        })
      })

      it('Citation', function () {
        cy.get('.citation-container > .copy-button').each(($button) => {
          cy.wrap($button).click()
          cy.get('.el-message').should(($message) => {
            expect($message, 'Popup should exist').to.exist
            expect($message, 'Popup should contain success message').to.contain('Successfully copied citation')
          })
        })
        // Check for content
        cy.get('.citation-container > div > a').each(($link) => {
          expect($link, 'Citation link should have doi href').to.have.attr('href').to.contain('doi.org')
          expect($link, 'Citation link should open a new tab').to.have.attr('target').to.contain('blank')
          cy.wrap($link).invoke('attr', 'href').then((href) => {
            cy.request(href).then((resp) => {
              expect(resp.status).to.eq(200)
            })
          })
        })
      })
    })

    describe('Versions Tab', { testIsolation: false }, function () {

      beforeEach(function () {
        cy.clickOnDetailTab('Versions').then((tab) => {
          if (!tab) {
            this.skip()
          }
        })
      })

      it('Button', function () {
        // Check for file actions
        cy.get('.version-table > .table-rows > :nth-child(4)').as('changelogs')
        cy.get('@changelogs').each(($cell) => {
          if (!$cell.text().includes('Not available')) {
            // Check for changelog
            cy.wrap($cell).find('.circle').as('icons')
            cy.get('@icons').should(($icon) => {
              expect($icon, 'There should be 2 icons').to.have.length(2)
            })
            cy.get('@icons').eq(0).click()
            cy.wait(5000)
            // Check for changelog popover
            cy.get('.el-dialog').should(($content) => {
              expect($content, 'Changelog content should be visible').to.be.visible
            })
            cy.get('.el-dialog__headerbtn:visible').click()
            cy.wait(5000)
            // Check for download
            cy.get('@icons').eq(1).click()
            cy.wait('@zipit', { timeout: 20000 }).then((intercept) => {
              expect(intercept.response.statusCode).to.eq(200)
            })
          }
        })
      })

      it('DOI', function () {
        cy.get('.version-table > .table-rows > :nth-child(5) > a').each(($doi) => {
          cy.wrap($doi).invoke('attr', 'href').then((href) => {
            cy.request(href).then((resp) => {
              expect(resp.status).to.eq(200)
              expect(resp.redirects, 'Redirect should exist').to.have.length(1)
            })
          })
        })
      })
    })
  })
})