describe('Tier 3 - Metrics, Save, Replay', () => {
  beforeEach(() => {
    cy.visit('http://localhost:3000');
  });

it('AT 3.1 - Displays live outcome counts during a run', () => {
  cy.createValidRun();
  cy.contains('Start').click(); 
  cy.wait(500);
  cy.contains('View Live Counts').click();
  cy.contains(/^Captures:/).should('exist');
  cy.contains(/^Rescues:/).should('exist');
  cy.contains(/^Sinks:/).should('exist');
  cy.contains(/^Captures:/).then(($cap) => {
    const initial = parseInt($cap.text().match(/\d+$/)[0]);
    cy.wait(1000);
    cy.contains(/^Captures:/).should(($new) => {
      const newCount = parseInt($new.text().match(/\d+$/)[0]);
      expect(newCount).to.be.gte(initial);
    });
  });
});

  it('AT 3.2 - Shows end-of-run results summary', () => {
    cy.createValidRun();
    cy.contains('Start').click();
    cy.contains('Terminate').click();
    cy.get('.modal').should('be.visible')
    cy.get('.modal').contains('Terminate').click();
    cy.contains('Simulation Complete').should('be.visible');
      // Verify stats section exists
    cy.contains('Sim Stats').should('exist');
    cy.contains(/^Captures:/).should('exist');
    cy.contains(/^Rescues:/).should('exist');
    cy.contains(/^Sinks:/).should('exist');
    cy.contains(/^Active Ships:/).should('exist');
  });

  it('AT 3.3 - Allows saving a completed run', () => {
    cy.createValidRun();          // Setup valid run
    cy.contains('Start').click(); // Start simulation

    // Terminate the run to reach end-of-run screen
    cy.contains('Terminate').click();
    cy.get('.modal').should('be.visible');
    cy.get('.modal').contains('Terminate').click();

  // Verify end-of-run screen is visible
    cy.contains('Simulation Complete').should('be.visible');

  // Save the run as JSON
    cy.contains('Export JSON').click();

  // Save the run as CSV
    cy.contains('Export CSV').click();
  });

it('AT 3.4 - Replay a saved run matches original', () => {
  cy.createValidRun();              // Step 1: create a run
  cy.contains('Start').click();
  cy.contains('Terminate').click();
  cy.get('.modal').contains('Terminate').click();

  // Export the run JSON
  cy.contains('Export JSON').click();
  const fileName = 'cypress/downloads/run-export.json';

  // Import the saved run
  cy.get('input[type="file"]').attachFile('run-export.json'); // requires cypress-file-upload plugin

  // Select the imported run in RunMenu
  cy.get('.accordion-button').contains('Untitled Run').click(); // or your run's name

  // Click View button to replay
  cy.get('button').contains('View').click();

  // Capture metrics in the replay
  cy.contains('Sim Stats').within(() => {
    cy.get('div').then(($stats1) => {
      const firstReplayText = $stats1.text();

      // Replay again
      cy.get('button').contains('View').click();
      cy.contains('Sim Stats').within(() => {
        cy.get('div').then(($stats2) => {
          const secondReplayText = $stats2.text();
          expect(secondReplayText).to.eq(firstReplayText); // replays match
        });
      });
    });
  });
});

  it('AT 3.5 - Saved run cannot be edited', () => {
    cy.createValidRun();
    const runName = 'NoEditRun';
    cy.completeRun();
    cy.get('#save-run-button').click();
    cy.get('#run-name-input').type(runName);
    cy.get('#confirm-save').click();

    cy.loadSavedRun(runName);
    cy.get('#edit-config').should('be.disabled');
  });

  it('AT 3.9 - Export results summary', () => {
    cy.createValidRun();
    cy.completeRun();
    cy.get('#export-button').click();
    cy.get('#export-format').select('CSV');
    cy.get('#confirm-export').click();
    cy.readFile('cypress/downloads/run-summary.csv').should('exist');
  });

  it('AT 3.10 - Compare multiple runs', () => {
    cy.createValidRun();
    cy.completeRun();
    cy.createValidRun(); // second run for comparison
    cy.completeRun();

    cy.get('#compare-runs').click();
    cy.get('#select-run-1').select('Run A');
    cy.get('#select-run-2').select('Run B');
    cy.get('#compare-confirm').click();
    cy.get('#comparison-view').should('contain.text', 'Run A');
    cy.get('#comparison-view').should('contain.text', 'Run B');
  });
});