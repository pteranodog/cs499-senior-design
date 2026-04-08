Cypress.Commands.add('createValidRun', (region = 'Somalian Coast') => {
    cy.contains('Create Run').click();
    cy.get('input[placeholder="Simulation Name"]').clear().type('Test');
    cy.get('input[placeholder="HH"]').clear().type("17");
    cy.get('input[placeholder="MM"]').clear().type("59");
    cy.get('input[placeholder="Duration"]').clear().type("2");
    cy.contains('Region').parent().find('select').select('Somalian Coast');
    //cy.contains('Weather Condition').parent().find('select').select('Clear');
    cy.contains('Select').click();
    cy.contains('View').click();
});

Cypress.Commands.add('completeRun', () => {
  cy.createValidRun();
  cy.contains('Start').click();
  cy.contains('Terminate').click();
});