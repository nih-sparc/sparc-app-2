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
      cy.waitForPageLoading()
    })

    describe.skip("Gallery Tab", { testIsolation: false }, function () {
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

    describe.skip("Landing page", { testIsolation: false }, function () {
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
        cy.get('.dataset-information-box > :nth-child(1)').invoke('text').then((value) => {
          const version = value.match(/[0-9]+/i)[0]
          cy.get('.dataset-information-box > :nth-child(2) > a').as('doiLink')
          cy.get('@doiLink').should(($link) => {
            expect($link, 'DOI link should contain correct link').to.have.attr('href').to.contain('https://doi.org/')
          })
          cy.get('@doiLink').invoke('attr', 'href').then((value) => {
            cy.request(value).then((resp) => {
              expect(resp.status).to.eq(200)
              if (resp.redirects && resp.redirects.length) {
                expect(resp.redirects[0]).to.contain(`datasets/${datasetId}/version/${version}`)
              }
            })
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
      it('Content and Link', function () {
        // Avoid failed test block new retries
        cy.backToDetailPage(datasetId)

        // Should switch to 'Abstract'
        cy.get('#datasetDetailsTabsContainer > .style1').contains('Abstract').click();
        cy.get('.active.style1.tab2.tab-link.p-16').should(($tab) => {
          expect($tab, 'Active tab should be Abstract').to.contain('Abstract')
        });

        // The following regular expression should capture space and letters
        cy.get('.dataset-description-info strong').contains(/Study Purpose:/i).parent().should(($content) => {
          expect($content.text(), '"Study Purpose" content should exist').to.match(/Study Purpose:(.+?)/i)
        })
        cy.get('.dataset-description-info strong').contains(/Data Collect(ion|ed):/i).parent().should(($content) => {
          expect($content.text(), '"Data Collection" content should exist').to.match(/Data Collect(ion|ed):(.+)/i)
        })
        cy.get('.dataset-description-info strong').contains(/(Primary )?Conclusion(s)?:/i).parent().should(($content) => {
          expect($content.text(), '"Primary Conclusions" content should exist').to.match(/(Primary )?Conclusion(s)?:(.+)/i)
        })

        // Check for Curator's Note
        cy.get('.dataset-description-info strong').contains(/Curator's Notes/i).should(($content) => {
          expect($content.text(), '"Curator Note" content should exist').to.exist
        })
        cy.get('.dataset-description-info strong').contains(/Experimental Design:/i).parent().should(($content) => {
          expect($content.text(), '"Experimental Design" content should exist').to.match(/Experimental Design:(.+)/i)
        })
        cy.get('.dataset-description-info strong').contains(/Completeness:/i).parent().should(($content) => {
          expect($content.text(), '"Completeness" content should exist').to.match(/Completeness:(.+)/i)
        })
        cy.get('.dataset-description-info strong').contains(/Subjects & Samples:/i).parent().should(($content) => {
          expect($content.text(), '"Subjects & Samples" content should exist').to.match(/Subjects & Samples:(.+)/i)
        })
        cy.get('.dataset-description-info strong').contains(/Primary vs(.)? derivative data:/i).parent().should(($content) => {
          expect($content.text(), '"Primary vs derivative data" content should exist').to.match(/Primary vs(.)? derivative data:(.+)/i)
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
          expect($content.text(), '"Experimental Approach" content should exist').to.match(/Experimental Approach:(.+)/i)
        })

        // Check for Subject Information
        cy.get('.dataset-description-info strong').contains(/Subject Information:/i).should(($content) => {
          expect($content.text(), '"Subject Information" content should exist').to.exist
        })
        cy.get('.dataset-description-info strong').contains(/Anatomical structure:/i).parent().should(($content) => {
          expect($content.text(), '"Anatomical structure" content should exist').to.match(/Anatomical structure:(.+)/i)
        })
        cy.get('.dataset-description-info strong').contains(/Species:/i).parent().should(($content) => {
          expect($content.text(), '"Species" content should exist').to.match(/Species:(.+)/i)
        })
        cy.get('.dataset-description-info strong').contains(/Sex:/i).parent().should(($content) => {
          expect($content.text(), '"Sex" content should exist').to.match(/Sex:(.+)/i)
        })
        cy.get('.dataset-description-info strong').contains(/Age Range:/i).parent().should(($content) => {
          expect($content.text(), '"Age Range" content should exist').to.match(/Age Range:(.+)/i)
        })
        cy.get('.dataset-description-info strong').contains(/Number of samples:/i).parent().should(($content) => {
          expect($content.text(), '"Number of samples" content should exist').to.match(/Number of samples:(.+)/i)
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
        cy.get('.dataset-description-info strong').contains(/Keywords:/i).parent().should(($content) => {
          expect($content.text(), '"Keywords" content should exist').to.match(/Keywords:(.+)/i)
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

        cy.get('@contact').then(($content) => {
          cy.get('.about-section-container a').then(($email) => {
            const author = $content.text().trim().replace($email.text(), '').replace('Contact Author: ', '')
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
                    expect($title, 'Project title should match').to.contain(project)
                  })
                  cy.get('span.label4').should(($author) => {
                    expect($author, 'Author should match').to.contain(author)
                  })
                  cy.get('span.label4').should(($institution) => {
                    expect($institution, 'Institution should match').to.contain(institution)
                  })
                  cy.get('.link1').should(($award) => {
                    expect(award, 'Award should match').to.contain($award.text().trim())
                  })
                  cy.go('back')
                  cy.waitForPageLoading()
                })
              })
            })
          })
        })
      })
    });

    it.skip("Cite Tab", function () {
      cy.backToDetailPage(datasetId)

      // Should switch to 'Cite'
      cy.get('#datasetDetailsTabsContainer > .style1', { timeout: 30000 }).contains('Cite').click();
      cy.get('.active.style1.tab2.tab-link.p-16').should('contain', 'Cite');

      // Check for title
      cy.get('.el-col-sm-16 > .heading2').invoke('text').then((value) => {
        cy.get('.info-citation > .citation-text', { timeout: 30000 }).should('contain', value.trim())
      })

      cy.get('.dataset-information-box > :nth-child(2) > a > u').invoke('text').then((value) => {
        // Check for citation doi
        cy.get('.info-citation > .citation-text', { timeout: 30000 }).should('contain', value.toUpperCase())

        // Check for source link
        const expectedLink = 'https://citation.crosscite.org/?doi=' + value;
        cy.get('.citation-details > p > a').should('have.attr', 'href', expectedLink);
      })
    });

    it.skip("Files Tab", function () {
      //First check if there is a Files tab
      cy.get('#datasetDetailsTabsContainer > .style1', { timeout: 30000 }).then(($tabs) => {
        if ($tabs.text().includes('Files')) {
          // Should switch to 'Files' if exist
          cy.wrap($tabs).contains('Files').click();
          cy.get('.active.style1.tab2.tab-link.p-16').should('contain', 'Files');

          // Check for content
          cy.get('[style=""] > .heading2.mb-8').should('have.text', 'Download Dataset');
          cy.get('.left-column > :nth-child(1) > div > .label4').should('have.text', 'Option 1 - Direct download: ');
          cy.get('.aws-download-column > :nth-child(1) > .label4').should('have.text', 'Option 2 - AWS download: ');

          // Check for download full dataset button
          cy.get('.left-column .el-button').contains('Download Full Dataset').should('be.visible');
          cy.contains('Dataset size').parent().then(($size) => {
            const size = parseFloat($size.text().match(/[0-9]+(.[0-9]+)?/i)[0])
            if (($size.text().includes("GB") && size > 5) || $size.text().includes("TB")) {
              cy.get('.el-tooltip__trigger > .el-button').should('not.be.enabled')
            } else {
              cy.get('.left-column > :nth-child(1) > a > .el-button').should('be.enabled')
            }
          })

          // Check for help link
          cy.get('.aws-download-column > :nth-child(1) > a').should('have.attr', 'href', 'https://docs.sparc.science/docs/accessing-public-datasets');
          cy.get('.aws-download-column > :nth-child(3) > a').should('have.attr', 'href', 'https://aws.amazon.com/s3/pricing/');

          //Find the download file button
          cy.contains('.el-table__row', 'dataset_description.xlsx').should('have.length', 1).as('datasetDescription');

          //there should be 4 icons, one for each action
          cy.get('@datasetDescription').find('.nuxt-icon.nuxt-icon--fill.action-icon').should('have.length', 4).as('icons')

          //Check get share links
          cy.get('@icons').eq(3).click({ force: true });
          cy.get('.el-message', { timeout: 30000 }).should('be.visible')

          //Check oSPARC link
          cy.get('@icons').eq(2).click({ force: true });
          cy.get('.el-dialog__headerbtn').click();

          // Check for files breadcrumb
          cy.get('.mb-16 > .dataset-link').should('have.attr', 'href', 'https://docs.sparc.science/docs/navigating-a-sparc-dataset');
          cy.get('.breadcrumb-link').should('have.class', 'breadcrumb-link');
          cy.get('.breadcrumb-link').should('have.attr', 'href').and('contain', 'datasetDetailsTab=files&path=files');
          cy.get('tbody').then(($ele) => {
            if ($ele.text().includes('Folder')) {
              cy.get('.cell > .file-name-wrap > .el-tooltip__trigger').then(($folder) => {
                cy.get('.breadcrumb-link').should('have.length', 1)
                cy.wrap($folder).first().click()
                cy.get('.breadcrumb-link').should('have.length', 2)
                cy.get(':nth-child(1) > .breadcrumb-link').click()
                cy.get('.breadcrumb-link').should('have.length', 1)
              })
            }
          })
        } else {
          this.skip();
        }
      });
    });

    it.skip("References Tab", function () {
      //First check if reference tab is present
      cy.get('#datasetDetailsTabsContainer > .style1', { timeout: 30000 }).then(($tabs) => {
        if ($tabs.text().includes('References')) {
          // Should switch to 'References' if exist
          cy.wrap($tabs).contains('References').click();
          cy.get('.active.style1.tab2.tab-link.p-16').should('contain', 'References');

          // Check for content
          cy.get('.dataset-references .heading2').contains(/Primary Publications for this Dataset|Associated Publications for this Dataset/);
          cy.get('.dataset-references .citation-container').each(($el) => {
            cy.wrap($el).find('div > a').should('have.attr', 'href').and('include', 'doi.org');
            cy.wrap($el).find('.copy-button').click();
            cy.get('.el-message').should('be.visible').and('contain', 'Successfully copied citation.')
          });

          // Check if redundant doi exist
          let doiList = []
          cy.get('.dataset-references').then(($content) => {
            if (
              $content.text().includes('Primary Publications for this Dataset') &&
              $content.text().includes('Preprints')
            ) {
              cy.get('.dataset-references .citation-container > div > a').each($doi => {
                cy.wrap($doi).invoke('attr', 'href').then((link) => {
                  if (!doiList.includes(link)) {
                    doiList.push(link)
                  } else {
                    throw new Error("Redundant doi references are found")
                  }
                })
              });
            }
          })
        } else {
          this.skip();
        }
      });
    });

    it.skip("Versions Tab", function () {
      //First check if version tab is present
      cy.get('#datasetDetailsTabsContainer > .style1', { timeout: 30000 }).then(($tabs) => {
        if ($tabs.text().includes('Versions')) {
          // Should switch to 'Versions' if exist
          cy.wrap($tabs).contains('Versions').click();
          cy.get('.active.style1.tab2.tab-link.p-16').should('contain', 'Versions');

          // Check for file actions
          cy.get('.version-table > :nth-child(2) > :nth-child(4)', { timeout: 30000 }).then(($cell) => {
            if ($cell.text().includes('Not available')) {
              cy.wrap($cell).should('contain', 'Not available')
            } else {
              // Check for changelog
              cy.wrap($cell).find('.circle').as('icons').should('have.length', 2)
              cy.get('@icons').eq(0).click()

              cy.wait(5000)

              // Check for changelog popover
              cy.get('.optional-content-container').should('be.visible');
              cy.get('.main-content-container').should('be.visible');
              cy.get('.el-icon.el-dialog__close:visible').click();

              // Check for download
              cy.intercept('**/zipit/discover').as('changelogDownload')
              cy.get('@icons').eq(1).click({ force: true })
              cy.get('@changelogDownload').should(({ request, response }) => {
                expect(request.method).to.equal('POST')
                expect(request.body.data.datasetId).to.equal(datasetId)
                expect(response.statusCode).to.equal(200)
              })
            }
          })

          // DOI link should link to page with correct version
          cy.get('.version-table > .table-rows').each(($row) => {
            cy.wrap($row).children('.el-col-pull-1').invoke('text').then((value) => {
              const version = value.match(/[0-9]+/i)[0]
              cy.wrap($row).children('.el-col-push-1').children('a').should('have.attr', 'href').and('include', 'doi.org').then((href) => {

                // Wait after each request in case of conflict
                cy.wait(5000)

                cy.request(href).then((resp) => {
                  expect(resp.status).to.eq(200);
                  expect(resp.body).to.include(`datasets/${datasetId}/version/${version}`);
                })
              });
            })
          })
        } else {
          this.skip()
        }
      });
    });
  });
});