describe('Tier 3 - Metrics, Save, Replay', () => {
  beforeEach(() => {
    cy.visit('http://localhost:3000');
  });

  it('AT 3.1 - Live metrics displayed', () => {
    cy.createValidRun();
    cy.contains('Start').click();
    cy.get('[data-testid="metrics"]').should('exist');
  });

  it('AT 3.2 - End-of-run summary', () => {
    cy.completeRun();
    cy.contains('Final Results').should('be.visible');
  });

  it('AT 3.3 - Save run', () => {
    cy.completeRun();
    cy.contains('Save').click();
    cy.get('input[placeholder="Name"]').type('Run1');
    cy.contains('Confirm').click();
  });

  it('AT 3.4 - Replay consistency', () => {
    cy.loadSavedRun('Run1');
    cy.contains('Replay').click();
    cy.get('[data-testid="metrics"]').should('exist');
  });

  it('AT 3.5 - No editing during replay', () => {
    cy.loadSavedRun('Run1');
    cy.get('input').should('be.disabled');
  });

  it('AT 3.6 - Replay controls', () => {
    cy.loadSavedRun('Run1');
    cy.contains('Pause').click();
    cy.contains('Step').click();
  });

  it('AT 3.8 - Config shown in replay', () => {
    cy.loadSavedRun('Run1');
    cy.contains('Configuration').should('be.visible');
  });

  it('AT 3.9 - Export results', () => {
    cy.completeRun();
    cy.contains('Export').click();
  });

  it('AT 3.10 - Compare runs', () => {
    cy.contains('Compare Runs').click();
    cy.get('[type="checkbox"]').check();
    cy.contains('Compare').click();
  });
});