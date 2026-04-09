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
    cy.get('.modal').should('be.visible')
    cy.get('.modal').contains('Terminate').click();
    cy.contains('Simulation Complete').should('be.visible');
  });

  it('AT 1.3 - Setup required before start', () => {
    //cy.createValidRun();
    cy.contains('Create Run').click();
    cy.get('input[placeholder="Simulation Name"]').clear();
    cy.get('input[placeholder="HH"]').clear().type("17");
    cy.get('input[placeholder="MM"]').clear().type("59");
    cy.get('input[placeholder="Duration"]').clear().type("2");
    cy.contains('Region').parent().find('select').select('Somalian Coast');
    //cy.contains('Weather Condition').parent().find('select').select('Clear');
    cy.contains('Select').click();
    cy.contains('View').click();
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
    cy.get('.leaflet-container').should('exist');
  });

  /*
  it('AT 1.6 - Participants visible', () => {
    cy.createValidRun();
    cy.contains('Start').click();
    cy.wait(500)
    cy.get('.participant-marker').should('exist');
  });
  */

  it('AT 1.7 - Time indicator updates during run', () => {
    cy.createValidRun();
    cy.contains('Start').click();

    // Grab FULL text (parent div)
    cy.contains('Time Elapsed:')
    .parent()
    .invoke('text')
    .then((t1) => {
      cy.wait(2000);

      cy.contains('Time Elapsed:')
      .parent()
      .invoke('text')
      .should((t2) => {
        expect(t2).not.to.eq(t1);
      });
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
    cy.contains('Terminate').click();
  });

  it('AT 1.10 - End state displayed', () => {
    cy.completeRun();
    cy.get('.modal').should('be.visible')
    cy.get('.modal').contains('Terminate').click();
    cy.contains('Simulation Complete').should('be.visible');
  });
});