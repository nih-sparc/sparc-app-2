import { retryableBefore } from "../support/retryableBefore.js"
import { stringToArray } from "../support/stringToArray.js"

/**
 * List of dataset ids
 */
const datasetIds = stringToArray(Cypress.env('DATASET_IDS'), ',')

datasetIds.forEach(datasetId => {

  describe(`Dataset ${datasetId}`, { testIsolation: false }, function () {
    retryableBefore(function () {
      cy.visit(`/datasets/${datasetId}?type=dataset`)
    });

    beforeEach(function () {
      cy.intercept('**/dataset_info/using_doi?**').as('dataset_info')
      cy.intercept('**/download?**').as('download')
      cy.intercept('**/zipit/**').as('zipit')
      cy.waitForPageLoading()
    })

    describe("Gallery Tab", { testIsolation: false }, function () {
      it('Gallery Items', function () {
        // Should switch to 'Gallery'
        cy.get('#datasetDetailsTabsContainer > .style1').contains('Gallery').click();
        cy.get('.active.style1.tab2.tab-link.p-16').should(($tab) => {
          expect($tab, 'Active tab should be Gallery').to.contain('Gallery')
        });

        cy.wait(5000)
        cy.wait('@dataset_info', { timeout: 20000 }).then((intercept) => {
          const response = intercept.response.body.result[0]
          // Check if gallery cards loaded correctly
          if (
            ('abi-scaffold-metadata-file' in response && response['abi-scaffold-metadata-file'].length) ||
            ('video' in response && response['video'].length) ||
            ('organs' in response && response['organs'].length) ||
            ('mbf-segmentation' in response && response['mbf-segmentation'].length) ||
            ('abi-plot' in response && response['abi-plot'].length) ||
            ('common-images' in response && response['common-images'].length) ||
            ('biolucida-2d' in response && response['biolucida-2d'].length) ||
            ('biolucida-3d' in response && response['biolucida-3d'].length)
          ) {

            cy.checkGalleyCardState()

          } else {
            cy.get('.content > .full-size').should(($message) => {
              expect($message, 'Gallery items not exist').to.contain('This dataset does not contain gallery items')
            })
          }
          // Check card if flatmap exist
          if ('organs' in response && response['organs'].length) {

            cy.findGalleryCard('flatmap', 'prev');

            cy.get('.el-card > .el-card__body').should(($card) => {
              expect($card, 'Flatmap card should exist').to.contain('flatmap')
            });
          }
        })
      })
    });

    describe("Landing page", { testIsolation: false }, function () {
      it('Top Left Panel - Thumbnail and Button', function () {
        // Should display image with correct dataset src
        cy.get('.dataset-image').should(($image) => {
          expect($image, 'Dataset image should have correct source').to.have.attr('src').to.contain(`https://assets.discover.pennsieve.io/dataset-assets/${datasetId}`)
        })

        //Check 'Get {dataset type}' directs to files tab (It could say either Get Dataset, Model, Scaffold, or Device based off the type of dataset)
        cy.contains('.button-container span', 'Get').click()
        cy.get('.active.style1.tab2.tab-link.p-16').should(($tab) => {
          expect($tab, 'Active tab should be Files').to.contain('Files')
        })
        cy.get('[style=""] > .heading2.mb-8').should(($title) => {
          expect($title, 'Title should be Download Dataset').to.contain('Download Dataset').to.be.visible
        })

        // Check 'Cite {dataset type}' directs to Cite tab (It could say either Cite Dataset, Model, Scaffold, or Device based off the type of dataset)
        cy.contains('.button-container span', 'Cite').click()
        cy.get('.active.style1.tab2.tab-link.p-16').should(($tab) => {
          expect($tab, 'Active tab should be Cite').to.contain('Cite')
        })
        cy.get('[style=""] > .heading2.mb-8').should(($title) => {
          expect($title, 'Title should be Dataset Citation').to.contain('Dataset Citation').to.be.visible
        })
      })

      it('Top Panel - Title and Contributor', function () {
        // Should display dataset title
        cy.get('.el-col-sm-16 > .heading2').should(($title) => {
          expect($title, 'Dataset title content should exist').to.exist
        })

        // Check for tooltip when hover over contributor 
        cy.get('.dataset-owners').should(($contributor) => {
          expect($contributor, 'Contributor content should exist').to.exist
        })
        cy.get('.dataset-owners > .contributor-item-wrap > .has-orcid').each(($contributor) => {
          cy.wrap($contributor).trigger('mouseenter', { eventConstructor: 'MouseEvent' })
          // Popover should be visible for each contributor
          cy.get('.orcid-popover:visible').should(($tooltip) => {
            expect($tooltip, 'Orcid tooltip should be visible').to.be.visible
            expect($tooltip, 'Orcid tooltip should contain contributor name').to.contain($contributor.text())
            expect($tooltip, 'Orcid tooltip should contain ORCID').to.contain('ORCID iD')
          })
          cy.wrap($contributor).trigger('mouseleave', { eventConstructor: 'MouseEvent' })
        })
      });

      it('Top Right Panel - Link', function () {
        // DOI link should link to page with correct version
        cy.get('.dataset-information-box > :nth-child(2) > a').as('doiLink')
        cy.get('@doiLink').should(($link) => {
          expect($link, 'DOI link should contain correct link').to.have.attr('href').to.contain('https://doi.org/')
        })
        cy.get('@doiLink').invoke('attr', 'href').then((href) => {
          cy.request(href).then((resp) => {
            expect(resp.status).to.eq(200)
            expect(resp.redirects.length, 'Redirect should exist').to.have.length(0)
          })
        })

        // Check 'View other version' directs to Versions tab
        cy.get('.dataset-information-box > div').contains('View other versions').click()
        cy.get('.active.style1.tab2.tab-link.p-16').should('contain', 'Versions')
        cy.get('[style=""] > .heading2.mb-8').should('contain', 'Versions for this Dataset').and('be.visible')
      })

      it('Left Panel - (Project,) Facet and Contributor', function () {
        // Avoid failed test block new retries
        cy.backToDetailPage(datasetId)

        // Check project link if exist
        cy.get('.similar-datasets-container').then(($content) => {
          if ($content.text().includes('project(s):')) {
            cy.wrap($content).get('.mt-8 > a > u').then(($title) => {
              const projectName = $title.text()
              cy.get('.mt-8 > a').click()
              cy.waitForPageLoading()
              cy.url().should((url) => {
                expect(url, 'URL should contain correct slug').to.contain('/about/projects/')
              })
              // Check for the title
              cy.get('.row > .heading2').should(($title) => {
                expect($title, 'Project title should match').to.contain(projectName)
              });
              cy.go('back')
              cy.waitForPageLoading()
            })
          }
        })

        cy.get('.facet-button-container > .el-tooltip__trigger > .tooltip-item').then(($facets) => {
          const randomIndex = Math.floor(Math.random() * $facets.length);
          const facetName = $facets.eq(randomIndex).text()
          cy.get('.facet-button-container > .el-tooltip__trigger > .tooltip-item').eq(randomIndex).click()
          cy.waitForPageLoading()
          cy.get('.el-tag__content').should(($tag) => {
            expect($tag, 'Tag content should exist in applied').to.have.length(1)
            expect($tag, `Tag should match name ${facetName}`).to.contain($facets.eq(randomIndex).text())
          })
          cy.go('back')
          cy.waitForPageLoading()
        })

        // Wait for the link in the clicked name
        cy.wait(5000)
        // Should search for contributor in find data page
        cy.get('.contributor-list > li > .el-tooltip__trigger > .tooltip-item').then(($contributors) => {
          const randomIndex = Math.floor(Math.random() * $contributors.length);
          const contributorName = $contributors.eq(randomIndex).text()
          cy.get('.contributor-list > li > .el-tooltip__trigger > .tooltip-item').eq(randomIndex).click()
          cy.waitForPageLoading()
          cy.get('.el-input__inner').should(($input) => {
            expect($input, `Search input should match name ${contributorName}`).to.have.value($contributors.eq(randomIndex).text())
          })
          cy.go('back')
          cy.waitForPageLoading()
        })
      })
    })

    describe("Abstract Tab", function () {
      it('Content, Link and Button', function () {
        // Avoid failed test block new retries
        cy.backToDetailPage(datasetId)

        // Should switch to 'Abstract'
        cy.get('#datasetDetailsTabsContainer > .style1').contains('Abstract').click();
        cy.get('.active.style1.tab2.tab-link.p-16').should(($tab) => {
          expect($tab, 'Active tab should be Abstract').to.contain('Abstract')
        });

        // The following regular expression should capture space and letters
        cy.get('.dataset-description-info strong').contains(/Study Purpose:/i).parent().should(($content) => {
          expect($content.text().trim(), '"Study Purpose" content should exist').to.match(/Study Purpose:(.+?)/i)
        })
        cy.get('.dataset-description-info strong').contains(/Data Collect(ion|ed):/i).parent().should(($content) => {
          expect($content.text().trim(), '"Data Collection" content should exist').to.match(/Data Collect(ion|ed):(.+)/i)
        })
        cy.get('.dataset-description-info strong').contains(/(Primary )?Conclusion(s)?:/i).parent().should(($content) => {
          expect($content.text().trim(), '"Primary Conclusions" content should exist').to.match(/(Primary )?Conclusion(s)?:(.+)/i)
        })

        // Check for Curator's Note
        cy.get('.dataset-description-info strong').contains(/Curator's Notes/i).should(($content) => {
          expect($content, '"Curator Note" content should exist').to.exist
        })
        cy.get('.dataset-description-info strong').contains(/Experimental Design:/i).parent().should(($content) => {
          expect($content.text().trim(), '"Experimental Design" content should exist').to.match(/Experimental Design:(.+)/i)
        })
        cy.get('.dataset-description-info strong').contains(/Completeness:/i).parent().should(($content) => {
          expect($content.text().trim(), '"Completeness" content should exist').to.match(/Completeness:(.+)/i)
        })
        cy.get('.dataset-description-info strong').contains(/Subjects & Samples:/i).parent().should(($content) => {
          expect($content.text().trim(), '"Subjects & Samples" content should exist').to.match(/Subjects & Samples:(.+)/i)
        })
        cy.get('.dataset-description-info strong').contains(/Primary vs(.)? derivative data:/i).parent().should(($content) => {
          expect($content.text().trim(), '"Primary vs derivative data" content should exist').to.match(/Primary vs(.)? derivative data:(.+)/i)
        })

        // Check for Metadata
        cy.get('.dataset-description-info strong').contains(/Protocol Links:/i).parents('.experimental-design-container').within(($link) => {
          if ($link.text().includes('https://doi.org/')) {
            cy.get('.link2').should(($link) => {
              expect($link, 'Link content should exist').to.exist
              expect($link.length, 'Link should have at lease one').to.be.greaterThan(0)
              expect($link, 'Link should have correct href').to.have.attr('href').to.contain('https://doi.org/')
            })
          }
        })
        cy.get('.dataset-description-info strong').contains(/Experimental Approach:/i).parent().should(($content) => {
          expect($content.text().trim(), '"Experimental Approach" content should exist').to.match(/Experimental Approach:(.+)/i)
        })

        // Check for Subject Information
        cy.get('.dataset-description-info strong').contains(/Subject Information:/i).should(($content) => {
          expect($content.text().trim(), '"Subject Information" content should exist').to.exist
        })
        cy.get('.dataset-description-info strong').contains(/Anatomical structure:/i).parent().should(($content) => {
          expect($content.text().trim(), '"Anatomical structure" content should exist').to.match(/Anatomical structure:(.+)/i)
        })
        cy.get('.dataset-description-info strong').contains(/Species:/i).parent().should(($content) => {
          expect($content.text().trim(), '"Species" content should exist').to.match(/Species:(.+)/i)
        })
        cy.get('.dataset-description-info strong').contains(/Sex:/i).parent().should(($content) => {
          expect($content.text().trim(), '"Sex" content should exist').to.match(/Sex:(.+)/i)
        })
        cy.get('.dataset-description-info strong').contains(/Age Range:/i).parent().should(($content) => {
          expect($content.text().trim(), '"Age Range" content should exist').to.match(/Age Range:(.+)/i)
        })
        cy.get('.dataset-description-info strong').contains(/Number of samples:/i).parent().should(($content) => {
          expect($content.text().trim(), '"Number of samples" content should exist').to.match(/Number of samples:(.+)/i)
        })

        // Check for downloading feature
        cy.get('.dataset-description-info a').not('.link2').as('download')
        cy.get('@download').should(($link) => {
          expect($link, 'Download link should exist').to.exist
          expect($link, 'Download link should have correct href').to.have.attr('href').to.match(/https:\/\/api.pennsieve.io\/discover\/datasets\/[0-9]+\/versions\/[0-9]+\/metadata/i)
        })
        cy.get('@download').invoke('attr', 'href').then((href) => {
          cy.request(href).then((resp) => {
            expect(resp.status).to.eq(200)
          })
        })

        // Check for Keywords
        cy.get('.keywords').should(($content) => {
          expect($content.length, '"Keywords" content should exist').to.be.greaterThan(0)
        })
      })
    });

    describe("About Tab", function () {
      it("Content and Link", function () {
        // Avoid failed test block new retries
        cy.backToDetailPage(datasetId)

        // Should switch to 'About'
        cy.get('#datasetDetailsTabsContainer > .style1').contains('About').click();
        cy.get('.active.style1.tab2.tab-link.p-16').should(($tab) => {
          expect($tab, 'Active tab should be About').to.contain('About')
        });

        // Check for content
        cy.get('.dataset-about-info .label4').contains(/Title:/i).parent().should(($content) => {
          expect($content.text().trim(), '"Title" content should exist').to.match(/Title:(.+)/i)
        })
        cy.get('.dataset-about-info .label4').contains(/First Published:/i).parent().should(($content) => {
          expect($content.text().trim(), '"First Published" content should exist').to.match(/First Published:(.+)/i)
        })
        cy.get('.dataset-about-info .label4').contains(/Last Published:/i).parent().should(($content) => {
          expect($content.text().trim(), '"Last Published" content should exist').to.match(/Last Published:(.+)/i)
        })
        cy.get('.dataset-about-info .label4').contains(/Contact Author:/i).parent().as('contact')
        cy.get('@contact').should(($content) => {
          expect($content.text().trim(), '"Contact Author" content should exist').to.match(/Contact Author:(.+)/i)
        })
        // Check for email href exist
        cy.get('@contact').then(($content) => {
          cy.get('.about-section-container a').then(($email) => {
            const author = $content.text().trim().replace($email.text(), '').replace('Contact Author: ', '')
            cy.get('.dataset-owners').then(($owners) => {
              expect($owners.text(), `Contact author ${author} should be in owners list`).to.contain(author)
            })
            expect($email, 'Email link should exist').to.have.attr('href').to.contain(`mailto:${$email.text()}`)
          })
        })

        cy.get('.dataset-about-info .label4').contains(/Award[(]s[)]:/i).parent().as('awards')
        cy.get('@awards').should(($content) => {
          expect($content.text().trim(), '"Awards" content should exist').to.match(/Award[(]s[)]:(.+)/i)
        })
        cy.get('@awards').within(() => {
          cy.get('a').then(($award) => {
            expect($award, 'Award href should exist').to.have.attr('href').to.contain('/about/projects/')
          })
        })
        cy.get('.dataset-about-info .label4').contains(/Funding Program[(]s[)]:/i).parent().should(($content) => {
          expect($content.text().trim(), '"Funding Programs" content should exist').to.match(/Funding Program[(]s[)]:(.+)/i)
        })
        cy.get('.dataset-about-info .label4').contains(/Associated project[(]s[)]:/i).parent().as('project')
        cy.get('@project').should(($content) => {
          expect($content.text().trim(), '"Associated projects" content should exist').to.match(/Associated project[(]s[)]:(.+)/i)
        })
        cy.get('.dataset-about-info .label4').contains(/Institution[(]s[)]:/i).parent().as('institutions')
        cy.get('@institutions').should(($content) => {
          expect($content.text().trim(), '"Institutions" content should exist').to.match(/Institution[(]s[)]:(.+)/i)
        })

        cy.get('.dataset-about-info .label4').contains(/Version [0-9]+ Revision [0-9]+:/i).parent().should(($content) => {
          expect($content.text().trim(), '"Version" content should exist').to.match(/Version [0-9]+ Revision [0-9]+:(.+)/i)
        })
        cy.get('.dataset-about-info .label4').contains(/Dataset DOI:/i).parent().should(($content) => {
          expect($content.text().trim(), '"Dataset DOI" content should exist').to.match(/Dataset DOI:(.+)/i)
        })

        // cy.get('.dataset-owners').then(($contributors) => {
        //   const contributors = $contributors.text().trim().replace('Contributors:', '')
        //   cy.get('@contact').then(($content) => {
        //     cy.get('.about-section-container a').then(($email) => {
        //       const author = $content.text().trim().replace($email.text(), '').replace('Contact Author: ', '')
        cy.get('@awards').then(($award) => {
          const award = $award.text().trim().replace('Award(s): ', '')
          cy.get('@institutions').then(($institution) => {
            const institution = $institution.text().trim().replace('Institution(s): ', '')
            cy.get('@project').then(($project) => {
              const project = $project.text().trim().replace('Associated project(s): ', '')
              cy.wrap($project).within(($button) => {
                cy.wrap($button).click()
              })
              cy.waitForPageLoading()
              cy.get('.row > .heading2').should(($title) => {
                expect($title, 'Project title should be the same').to.contain(project)
              })
              cy.get('span.label4').parent().contains(/INSTITUTION[(]S[)]:/i).should(($institution) => {
                expect($institution, 'Institution should be the same').to.contain(institution)
              })
              cy.get('.link1').should(($award) => {
                expect(award, 'Award should be the same').to.include($award.text().trim())
              })
              // cy.get('span.label4').parent().contains(/PRINCIPAL INVESTIGATOR[(]S[)]:/i).should(($PI) => {
              //   const PI = $PI.text().trim().replace('PRINCIPAL INVESTIGATOR(S): ', '')
              //   const contributorList = contributors.split(',')
              //   let PIIsCOntactAuthor = false
              //   let PIIsContributor = false
              //   contributorList.forEach((contributor) => {
              //     if (!PIIsContributor) {
              //       // Avoid slightly name difference
              //       PIIsContributor = $PI.text().includes(contributor.trim()) || contributor.trim().includes(PI)
              //       PIIsCOntactAuthor = $PI.text().includes(author) || author.includes(contributor.trim())
              //     }
              //   })
              //   expect(PIIsContributor, 'Principal Investigator should list as dataset contributor').to.be.true
              //   expect(PIIsCOntactAuthor, 'Principal Investigator should list as contact author').to.be.true
              // })
              cy.go('back')
              cy.waitForPageLoading()
            })
          })
        })
        //     })
        //   })
        // })
      })
    });

    describe("Cite Tab", function () {
      it("Content and Link", function () {
        cy.backToDetailPage(datasetId)

        // Should switch to 'Cite'
        cy.get('#datasetDetailsTabsContainer > .style1').contains('Cite').click();
        cy.get('.active.style1.tab2.tab-link.p-16').should(($tab) => {
          expect($tab, 'Active tab should be Cite').to.contain('Cite')
        });

        cy.get('.info-citation').should(($citation) => {
          expect($citation, 'Citation should exist').to.exist
          expect($citation.length, 'Cite should have multiple citation formats').to.be.greaterThan(0)
        })

        // Check for title
        cy.get('.el-col-sm-16 > .heading2').invoke('text').then((value) => {
          cy.get('.info-citation > .citation-text', { timeout: 30000 }).should(($citation) => {
            expect($citation, 'Citation should contain title').to.contain(value.trim())
          })
        })

        cy.get('.dataset-information-box > :nth-child(2) > a > u').invoke('text').then((value) => {
          // Check for citation doi
          cy.get('.info-citation > .citation-text', { timeout: 30000 }).should(($citation) => {
            expect($citation, 'Citation should contain doi').to.contain(value)
          })

          // Check for source link
          cy.get('.citation-details > p > a').invoke('attr', 'href').then((href) => {
            expect(href, 'Link should have correct href').to.contain(`https://citation.crosscite.org/?doi=${value}`)
            expect(href, 'Link should open a new tab').to.have.attr('target').to.contain('blank')
            cy.request(href).then((resp) => {
              expect(resp.status).to.eq(200);
            })
          })
        })
      })
    });

    describe("Files Tab", function () {
      it("Content, Link and Button", function () {
        //First check if there is a Files tab
        cy.get('#datasetDetailsTabsContainer > .style1').then(($tabs) => {
          if ($tabs.text().includes('Files')) {
            // Should switch to 'Files' if exist
            cy.wrap($tabs).contains('Files').click();
            cy.get('.active.style1.tab2.tab-link.p-16').should(($tab) => {
              expect($tab, 'Active tab should be Files').to.contain('Files')
            });

            // Check for direct download content
            cy.get('.left-column .label4').should(($option) => {
              expect($option, 'Option 1 should be Direct download').to.contain('Direct download')
            });
            // Check for download full dataset button
            cy.get('.left-column .el-button').contains('Download Full Dataset').should(($button) => {
              expect($button, 'Download button should exist').to.exist
            })
            cy.get('.mb-8 .label4:visible').contains(/Dataset size:/i).parent().then(($size) => {
              const size = parseFloat($size.text().match(/[0-9]+(.[0-9]+)?/i)[0])
              if (($size.text().includes("GB") && size > 5) || $size.text().includes("TB")) {
                cy.get('.el-tooltip__trigger > .el-button').should(($button) => {
                  expect($button, 'Download button should be disabled when size is greater than 5GB').to.be.disabled
                })
              } else {
                cy.get('.left-column > :nth-child(1) > a > .el-button').should(($button) => {
                  expect($button, 'Download button should be enabled when size is less than 5GB').to.be.enabled
                })
                // Check if datasets is downloaded
                cy.get('.left-column > :nth-child(1) > a > .el-button').click()
                cy.wait('@download', { timeout: 20000 }).then((intercept) => {
                  expect(intercept.response.statusCode).to.eq(200)
                })
              }
            })

            // Check for aws download content
            cy.get('.aws-download-column .label4').should(($option) => {
              expect($option, 'Option 2 should be AWS download').to.contain('AWS S3')
            });
            cy.get('.aws-download-column > :nth-child(1) > a').should(($link) => {
              expect($link, 'AWS pricing link should have correct href').to.have.attr('href').to.contain('https://aws.amazon.com/s3/pricing/')
              expect($link, 'AWS pricing link should open a new tab').to.have.attr('target').to.contain('blank')
            });
            cy.get('.aws-download-column > :nth-child(3) > a').should(($link) => {
              expect($link, 'Help page link should have correct href').to.have.attr('href').to.contain('https://docs.sparc.science/docs/accessing-public-datasets')
              expect($link, 'Help page link should open a new tab').to.have.attr('target').to.contain('blank')
            });

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
            cy.get('.el-dialog__headerbtn').click();
            // Check get share links  
            cy.get('@actions').eq(3).click({ force: true });
            cy.get('.el-message', { timeout: 30000 }).should(($message) => {
              expect($message, 'Message should be visible').to.be.visible
            })

            // Check for files browser
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
          } else {
            this();
          }
        })
      })
    })

    describe("References Tab", function () {
      it("Link", function () {
        //First check if reference tab is present
        cy.get('#datasetDetailsTabsContainer > .style1').then(($tabs) => {
          if ($tabs.text().includes('References')) {
            // Should switch to 'References' if exist
            cy.wrap($tabs).contains('References').click();
            cy.get('.active.style1.tab2.tab-link.p-16').should(($tab) => {
              expect($tab, 'Active tab should be References').to.contain('References')
            });

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

            cy.get('.citation-container > .copy-button').each(($button) => {
              cy.wrap($button).click()
              cy.get('.el-message').should(($message) => {
                expect($message, 'Popup should exist').to.exist
                expect($message, 'Popup should contain success message').to.contain('Successfully copied citation')
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
                      throw new Error("Redundant doi references are found")
                    }
                  })
                });
              }
            })
          } else {
            this();
          }
        })
      })
    });

    describe("Versions Tab", function () {
      it("Button and Link", function () {
        // First check if version tab is present
        cy.get('#datasetDetailsTabsContainer > .style1').then(($tabs) => {
          if ($tabs.text().includes('Versions')) {
            // Should switch to 'Versions' if exist
            cy.wrap($tabs).contains('Versions').click();
            cy.get('.active.style1.tab2.tab-link.p-16').should(($tab) => {
              expect($tab, 'Active tab should be Versions').to.contain('Versions')
            });

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
                });
                cy.get('.el-dialog__headerbtn').click();
                cy.wait(5000)

                // Check for download
                cy.get('@icons').eq(1).click()
                cy.wait('@zipit', { timeout: 20000 }).then((intercept) => {
                  expect(intercept.response.statusCode).to.eq(200)
                })
              }
            })

            cy.get('.version-table > .table-rows > :nth-child(5) > a').as('dois')
            cy.get('@dois').each(($doi) => {
              cy.wrap($doi).invoke('attr', 'href').then((href) => {
                cy.request(href).then((resp) => {
                  expect(resp.status).to.eq(200)
                  expect(resp.redirects.length, 'Redirect should exist').to.have.length(0)
                })
              })
            })
          } else {
            this()
          }
        })
      });
    });
  });
});