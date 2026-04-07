describe('Tier 2 - Configuration', () => {
  beforeEach(() => {
    cy.visit('http://localhost:3000');
    cy.contains('Create Run').click();
  });

  it('AT 2.1 - Configure participant rates', () => {
    cy.get('[data-testid="pirate-rate"]').clear().type('50');
    cy.get('[data-testid="merchant-rate"]').clear().type('50');
  });

  it('AT 2.2 - Configure spatial bias', () => {
    cy.get('[data-testid="region-bias"]').select(1);
  });

  it('AT 2.3 - Auto-valid bias totals', () => {
    cy.get('[data-testid="zone1"]').clear().type('80');
    cy.get('[data-testid="zone2"]').clear().type('80');
    cy.contains('Invalid').should('not.exist');
  });

  it('AT 2.4 - Duration validation', () => {
    cy.get('input[placeholder="Duration"]').clear().type('-1');
    cy.contains('Invalid').should('be.visible');

    cy.get('input[placeholder="Duration"]').clear().type('5');
  });

  it('AT 2.5 - Operational conditions exist', () => {
    cy.contains('Weather Condition').should('be.visible');
  });

  it('AT 2.6 - Per-condition configuration', () => {
    cy.get('[data-testid="day-rate"]').type('30');
    cy.get('[data-testid="night-rate"]').type('70');
  });

  it('AT 2.7 - Config locked during run', () => {
    cy.createValidRun();
    cy.contains('Start').click();
    cy.get('input').should('be.disabled');
  });

  it('AT 2.8 - Single-step control', () => {
    cy.createValidRun();
    cy.contains('Start').click();
    cy.contains('Pause').click();
    cy.contains('Step').click();
  });

  it('AT 2.9 - Adjustable speed', () => {
    cy.createValidRun();
    cy.contains('Start').click();
    cy.get('[data-testid="speed"]').select('2x');
  });

  it('AT 2.10 - Reset workflow', () => {
    cy.createValidRun();
    cy.contains('Reset').click();
    cy.contains('Create Run').should('be.visible');
  });
});