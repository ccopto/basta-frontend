describe('Lobby Smoke Test - Host', () => {
  beforeEach(() => {
    // 1. Mock Storage/Auth state as Host
    cy.window().then((win) => {
        win.sessionStorage.setItem('basta_player_state', JSON.stringify({
            userId: 1, nickname: 'Host', isHost: true, gameCode: 'ABCD'
        }));
    });

    // 2. Mock APIs
    cy.intercept('GET', '**/api/games/ABCD', {
        statusCode: 200,
        body: {
            gameCode: 'ABCD',
            totalRounds: 5,
            timerDuration: 60,
            language: 'en',
            state: 'Lobby',
            players: [
              { userId: 1, nickname: 'Host', isHost: true, isOnline: true },
              { userId: 2, nickname: 'Guest', isHost: false, isOnline: true }
            ],
            selectedCategoryIds: [1],
            hostUserId: 1
        }
    }).as('getLobby');
    
    cy.visit('/lobby/ABCD');
    cy.wait('@getLobby');
  });

  it('should show configure game controls for host', () => {
    // 3. Assert Host Controls
    cy.get('.host-controls').should('be.visible');
    cy.contains('Configure Game').should('not.be.disabled').click();
    
    // 4. Assert navigation
    cy.url().should('include', '/setup/ABCD');
  });
});
