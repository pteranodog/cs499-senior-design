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

    cy.contains('Sim Stats').should('exist');
    cy.contains(/^Captures:/).should('exist');
    cy.contains(/^Rescues:/).should('exist');
    cy.contains(/^Sinks:/).should('exist');
    cy.contains(/^Active Ships:/).should('exist');
  });

  it('AT 3.3 & 3.9- Allows saving a completed run in a format suitable for analysis', () => {
    cy.createValidRun();
    cy.contains('Start').click(); 
    cy.contains('Terminate').click();
    cy.get('.modal').should('be.visible');
    cy.get('.modal').contains('Terminate').click();
    cy.contains('Simulation Complete').should('be.visible');
    cy.contains('Export JSON').click();
    cy.contains('Export CSV').click();
  });

  it('AT 3.4 - Saved run can be replayed exactly', () => {

  });

/*
it('AT 3.5 - Load a saved run and replay w/o allowing changes', () => {

});
*/

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