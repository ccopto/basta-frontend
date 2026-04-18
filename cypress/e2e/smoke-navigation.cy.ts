describe('Smoke Navigation', () => {
  it('should load the home page and have the title', () => {
    cy.visit('/');
    cy.contains('Basta! Online').should('be.visible');
  });

  it('should navigate to the Create Game page', () => {
    cy.visit('/');
    cy.contains('Create Game').click();
    cy.url().should('include', '/create');
    cy.contains('Game Setup').should('be.visible');
  });

  it('should redirect to home if entering game page without session', () => {
    cy.visit('/game/ABCD');
    cy.url().should('include', '/home');
  });
});
