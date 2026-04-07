describe('Tier 4 - Operating Areas', () => {
  beforeEach(() => {
    cy.visit('http://localhost:3000');
  });

  it('AT 4.1 - Multiple operating areas', () => {
    cy.get('select').find('option').should('have.length.greaterThan', 1);
  });

  it('AT 4.2 - Add operating area', () => {
    cy.contains('Add Area').click();
    cy.get('input[name="name"]').type('Test Area');
    cy.get('textarea[name="boundary"]').type('coords');
    cy.contains('Save').click();
  });

  it('AT 4.3 - Run in new area', () => {
    cy.createValidRun('Test Area');
    cy.contains('Start').click();
  });

  it('AT 4.4 - Full functionality in new area', () => {
    cy.createValidRun('Test Area');
    cy.contains('Start').click();
    cy.contains('Terminate').click();
    cy.contains('Save').click();
  });

  it('AT 4.5 - Defaults + override', () => {
    cy.contains('Create Run').click();
    cy.get('[data-testid="pirate-rate"]').clear().type('60');
  });

  it('AT 4.6 - Scenario portability', () => {
    cy.saveScenario();
    cy.loadScenarioInDifferentArea();
  });

  it('AT 4.7 - Reject invalid area', () => {
    cy.contains('Add Area').click();
    cy.contains('Save').click();
    cy.contains('Error').should('be.visible');
  });

  it('AT 4.8 - Manage areas', () => {
    cy.contains('Manage Areas').click();
    cy.contains('Rename').click();
  });
});