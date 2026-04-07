describe('Tier 1 - Core Requirements', () => {
  beforeEach(() => {
    cy.visit('http://localhost:3000');
  });

  it('AT 1.1 - Accessible via browser', () => {
    cy.contains('Create Run').should('be.visible');
  });

  it('AT 1.2 - Complete simulation run', () => {
    cy.createValidRun();
    cy.contains('Start').click();
    cy.contains('Terminate').click();
    cy.contains('Results').should('be.visible');
  });

  it('AT 1.3 - Setup required before start', () => {
    cy.contains('Start').should('be.disabled');
  });

  it('AT 1.4 - Run controls work', () => {
    cy.createValidRun();
    cy.contains('Start').click();
    cy.contains('Pause').click();
    cy.contains('Resume').click();
    cy.contains('Terminate').click();
  });

  it('AT 1.5 - Operating area displayed', () => {
    cy.createValidRun();
    cy.contains('Start').click();
    cy.get('#map, canvas').should('exist');
  });

  it('AT 1.6 - Participants visible', () => {
    cy.createValidRun();
    cy.contains('Start').click();
    cy.get('.participant').should('exist');
  });

  it('AT 1.7 - Time indicator updates', () => {
    cy.createValidRun();
    cy.contains('Start').click();

    cy.get('[data-testid="timer"]').invoke('text').then((t1) => {
      cy.wait(1000);
      cy.get('[data-testid="timer"]').invoke('text').should('not.eq', t1);
    });
  });

  it('AT 1.8 - No crash during interactions', () => {
    cy.createValidRun();
    cy.contains('Start').click();

    for (let i = 0; i < 3; i++) {
      cy.contains('Pause').click();
      cy.contains('Resume').click();
    }
  });

  it('AT 1.9 - Warn before losing unsaved run', () => {
    cy.createValidRun();
    cy.contains('Start').click();

    cy.on('window:confirm', () => false);
    cy.contains('Exit').click();
  });

  it('AT 1.10 - End state displayed', () => {
    cy.completeRun();
    cy.contains('Summary').should('be.visible');
  });
});