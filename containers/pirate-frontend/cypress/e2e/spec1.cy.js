describe('Tier 1 - Setup', () => {
  beforeEach(() => {
    cy.visit('http://localhost:3000');
  });

  it('Setup Workflow', () => {
    cy.contains('Create Run').click();
    cy.get('input[placeholder="Simulation Name"]').clear().type('Test');
    cy.get('input[placeholder="HH"]').clear().type("17");
    cy.get('input[placeholder="MM"]').clear().type("59");
    cy.get('input[placeholder="Duration"]').clear().type("2");
    cy.contains('Region').parent().find('select').select('Somalian Coast');
    cy.contains('Weather Condition').parent().find('select').select('Clear');
    cy.contains('Select').click();
    cy.contains('View').click();

  });
});