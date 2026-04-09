describe('Tier 2 - Configuration', () => {
  beforeEach(() => {
    cy.visit('http://localhost:3000');
    cy.contains('Create Run').click();

  });

  it('AT 2.1 - Configure participant presence rates', () => {
    cy.contains('Duplicate').should('exist');

    cy.get('[data-testid="maxMerchants-slider"]').invoke('val', 50).trigger('change');
    cy.get('[data-testid="maxPirates-slider"]').invoke('val', 30).trigger('change');

    cy.get('[data-testid="maxMerchants-label"]').should('contain', '50');
    cy.get('[data-testid="maxPirates-label"]').should('contain', '30');
  });

  // AT 2.4
  it('AT 2.4 - Configure run duration with validation', () => {
    cy.get('[data-testid="duration-input"]').clear().type('60');
    cy.get('[data-testid="start-run"]').click();
    cy.get('[data-testid="simulation-view"]').should('exist');

    cy.get('[data-testid="duration-input"]').clear().type('-5');
    cy.get('[data-testid="duration-error"]').should('be.visible');

    cy.get('[data-testid="duration-input"]').clear().type('999999');
    cy.get('[data-testid="duration-error"]').should('be.visible');
  });

  // AT 2.5
  it('AT 2.5 - Configure operational conditions', () => {
    cy.get('[data-testid="condition-day"]').click();
    cy.get('[data-testid="condition-night"]').click();

    cy.get('[data-testid="start-run"]').click();

    cy.get('[data-testid="condition-indicator"]').should('exist');
  });

  // AT 2.7
  it('AT 2.7 - Lock configuration during run', () => {
    cy.get('[data-testid="start-run"]').click();

    cy.get('[data-testid="merchant-rate"]').should('be.disabled');
    cy.get('[data-testid="duration-input"]').should('be.disabled');

    cy.get('[data-testid="config-summary"]').should('be.visible');
  });

  // AT 2.8
  it('AT 2.8 - Single-step control works', () => {
    cy.get('[data-testid="start-run"]').click();
    cy.get('[data-testid="pause-btn"]').click();

    cy.get('[data-testid="step-btn"]').click();
    cy.get('[data-testid="simulation-tick"]').then(($val1) => {
      const tick1 = $val1.text();

      cy.get('[data-testid="step-btn"]').click();
      cy.get('[data-testid="simulation-tick"]').should(($val2) => {
        expect($val2.text()).not.to.eq(tick1);
      });
    });
  });

  // AT 2.9
  it('AT 2.9 - Adjust execution speed', () => {
    cy.get('[data-testid="start-run"]').click();

    cy.get('[data-testid="speed-control"]').select('2x');
    cy.get('[data-testid="speed-control"]').should('have.value', '2x');
  });

  // AT 2.10
  it('AT 2.10 - Reset/New Run workflow', () => {
    cy.get('[data-testid="start-run"]').click();

    cy.get('[data-testid="reset-btn"]').click();

    cy.get('[data-testid="setup-screen"]').should('be.visible');
    cy.get('[data-testid="simulation-view"]').should('not.exist');
  });
});