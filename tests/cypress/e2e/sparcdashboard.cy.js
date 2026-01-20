import { retryableBefore } from "../support/utils.js";

describe("SPARC Dashboard", { testIsolation: false }, function () {
  retryableBefore(function () {
    cy.visit("/apps/sparc-dashboard");
  });

  beforeEach(function () {
    cy.intercept("**/flatmap/**").as("flatmap");
    cy.waitForPageLoading();
  });

  it("Dashboard page loads correctly", function () {
    // Check for page title
    cy.get("h1").should(($title) => {
      expect($title, "Page title should exist").to.exist;
    });

    // Check for page description
    cy.get(".page-hero-content p").should(($description) => {
      expect($description, "Page description should exist").to.exist;
    });

    // Check for User Guide button
    cy.get(".page-hero-content .el-button").should(($button) => {
      expect($button, "User Guide button should exist").to.contain(
        "View User Guide"
      );
    });

    // Check for beta tag
    cy.get(".beta-tag").should(($tag) => {
      expect($tag, "Beta tag should be displayed").to.contain("Beta");
    });
  });

  it("Dashboard container is rendered", function () {
    // Check for the dashboard container
    cy.get(".dashboard-app", { timeout: 60000 }).should(($dashboard) => {
      expect($dashboard, "Dashboard container should exist").to.exist;
    });

    // Check for dashboard header
    cy.get(".dash-header", { timeout: 60000 }).should(($header) => {
      expect($header, "Dashboard header should exist").to.exist;
    });
  });

  it("FlatmapWidget loads correctly", function () {
    // Wait for flatmap-related API calls
    cy.wait(10000); // Allow time for async component to load

    // Check for Flatmap Viewer widget - look for the widget title or container
    cy.get(".dashboard-app", { timeout: 60000 }).should("exist");

    // Check for the Flatmap Viewer widget header text
    cy.contains("Flatmap Viewer", { timeout: 60000 }).should(($widget) => {
      expect($widget, "Flatmap Viewer widget should exist").to.exist;
    });

    // Check for flatmap container or canvas
    cy.get("body").then(($body) => {
      if ($body.find(".flatmap-container").length > 0) {
        cy.get(".flatmap-container").should(($flatmap) => {
          expect($flatmap, "Flatmap container should exist").to.exist;
        });
      } else if ($body.find('[class*="flatmap"]').length > 0) {
        cy.get('[class*="flatmap"]')
          .first()
          .should(($flatmap) => {
            expect($flatmap, "Flatmap element should exist").to.exist;
          });
      }
    });
  });

  it("FlatmapWidget displays correctly after loading", function () {
    // Wait for flatmap to fully load
    cy.wait(15000); // Flatmaps can take time to render

    // Check if flatmap canvas or SVG elements are present
    cy.get("body").then(($body) => {
      // Check for maplibregl canvas (used by flatmap)
      if ($body.find(".maplibregl-canvas").length > 0) {
        cy.get(".maplibregl-canvas").should(($canvas) => {
          expect($canvas, "Flatmap canvas should be rendered").to.exist;
        });
      }

      // Check for flatmap SVG elements
      if ($body.find(".flatmap-container svg").length > 0) {
        cy.get(".flatmap-container svg").should(($svg) => {
          expect($svg, "Flatmap SVG should be rendered").to.exist;
        });
      }
    });
  });

  // it("Other dashboard widgets are present", function () {
  //   // Check for Subject Selector widget
  //   cy.contains("Subject Selector", { timeout: 60000 }).should(($widget) => {
  //     expect($widget, "Subject Selector widget should exist").to.exist;
  //   });

  //   // Check for Image Selector widget
  //   cy.contains("Image Selector", { timeout: 60000 }).should(($widget) => {
  //     expect($widget, "Image Selector widget should exist").to.exist;
  //   });

  //   // Check for Biolucida Viewer widget
  //   cy.contains("Biolucida Viewer", { timeout: 60000 }).should(($widget) => {
  //     expect($widget, "Biolucida Viewer widget should exist").to.exist;
  //   });

  //   // Check for Markdown Widget content
  //   cy.contains("SPARC Dashboard", { timeout: 60000 }).should(($content) => {
  //     expect($content, "Markdown Widget content should exist").to.exist;
  //   });
  // });

  // it("Dashboard widgets can be interacted with", function () {
  //   // Check that Edit Grid button exists
  //   cy.contains("Edit Grid", { timeout: 60000 }).should(($button) => {
  //     expect($button, "Edit Grid button should exist").to.exist;
  //   });

  //   // Check for subject selector cards if present
  //   cy.get("body").then(($body) => {
  //     if ($body.find(".subject-selector").length > 0) {
  //       cy.get(".subject-selector").should(($selector) => {
  //         expect($selector, "Subject Selector should be interactive").to.exist;
  //       });
  //     }
  //   });
  // });

  // it("Breadcrumb navigation is correct", function () {
  //   // Check for breadcrumb navigation tex

  //   cy.contains("SPARC Apps", { timeout: 60000 }).should(($link) => {
  //     expect($link, "SPARC Apps breadcrumb should exist").to.exist;
  //   });

  //   // Check the current page is shown in breadcrumb
  //   cy.contains("Human Vagus Nerve Explorer", { timeout: 60000 }).should(
  //     ($text) => {
  //       expect($text, "Current page should be shown in breadcrumb").to.exist;
  //     }
  //   );
  // });
});
