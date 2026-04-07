describe('Tier 5 - UX & Accessibility', () => {
  beforeEach(() => {
    cy.visit('http://localhost:3000');
  });

  it('AT 5.1 - Clear labels', () => {
    cy.contains('Pirate Activity').should('be.visible');
  });

  it('AT 5.2 - Condition indicator visible', () => {
    cy.createValidRun();
    cy.contains('Start').click();
    cy.get('[data-testid="condition"]').should('exist');
  });

  it('AT 5.3 - Prevent invalid actions', () => {
    cy.contains('Replay').click();
    cy.contains('Load').should('exist');
  });

  it('AT 5.4 - Actionable error messages', () => {
    cy.contains('Add Area').click();
    cy.contains('Save').click();
    cy.contains('Please').should('be.visible');
  });

  it('AT 5.5 - UI remains responsive', () => {
    cy.createValidRun();
    cy.contains('Start').click();
    cy.contains('Pause').click();
    cy.contains('Resume').click();
  });

  it('AT 5.6 - Zoom functionality', () => {
    cy.createValidRun();
    cy.contains('Start').click();
    cy.get('[data-testid="zoom-in"]').click();
    cy.get('[data-testid="zoom-out"]').click();
  });

  it('AT 5.7 - Inspect participant', () => {
    cy.createValidRun();
    cy.contains('Start').click();
    cy.get('.participant').first().click();
  });

  it('AT 5.8 - Run again feature', () => {
    cy.completeRun();
    cy.contains('Run Again').click();
  });

  it('AT 5.9 - Help panel', () => {
    cy.contains('Help').click();
    cy.contains('How to').should('be.visible');
  });

  it('AT 5.10 - Keyboard navigation', () => {
    cy.get('body').tab();
    cy.focused().should('exist');
  });
});