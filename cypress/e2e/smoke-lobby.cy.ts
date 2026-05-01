describe('Lobby Smoke Test', () => {
  beforeEach(() => {
    cy.visit('/');
  });

  it('should join game and trigger SignalR event', () => {
    // 1. Mock API
    cy.intercept('POST', '**/api/games/ABCD/join', {
        statusCode: 200,
        body: { userId: 1, gameCode: 'ABCD' }
    });
    
    // 2. Perform Join Action
    cy.get('input#nickname').type('Nick');
    cy.get('input#gameCode').type('ABCD');
    cy.contains('Join Game').click();

    // 3. Trigger SignalR event manually
    cy.triggerSignalR('GameStarted', {});
    
    // 4. Assert navigation
    cy.url().should('include', '/game/ABCD');
  });
});
