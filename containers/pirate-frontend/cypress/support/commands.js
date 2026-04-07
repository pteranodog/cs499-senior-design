Cypress.Commands.add('createValidRun', (region = 'Somalian Coast') => {
  cy.contains('Create Run').click();
  cy.get('input[placeholder="Simulation Name"]').type('Test');
  cy.get('input[placeholder="HH"]').type('10');
  cy.get('input[placeholder="MM"]').type('00');
  cy.get('input[placeholder="Duration"]').type('2');
  cy.contains('Region').parent().find('select').select(region);
  cy.contains('Weather Condition').parent().find('select').select('Clear');
  cy.contains('Select').click();
  cy.contains('View').click();
});

Cypress.Commands.add('completeRun', () => {
  cy.createValidRun();
  cy.contains('Start').click();
  cy.contains('Terminate').click();
});