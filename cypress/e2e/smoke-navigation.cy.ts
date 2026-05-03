describe('Smoke Navigation', () => {
  it('should load the home page and have the title', () => {
    cy.visit('/');
    cy.contains('Basta').should('be.visible');
    cy.contains('Online').should('be.visible');
  });

  it('should redirect to home if entering game page without session', () => {
    cy.visit('/game/ABCD');
    cy.url().should('include', '/home');
  });
});
