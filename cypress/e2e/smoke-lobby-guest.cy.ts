describe('Lobby Smoke Test - Guest', () => {
  beforeEach(() => {
    // 1. Mock Storage/Auth state as a Guest
    cy.window().then((win) => {
        win.sessionStorage.setItem('basta_player_state', JSON.stringify({
            userId: 2, nickname: 'Guest', isHost: false, gameCode: 'ABCD'
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

  it('should display waiting indicator and navigate on GameStarted', () => {
    // 3. Verify Lobby is visible
    cy.get('.lobby-card').should('be.visible');
    cy.get('.waiting-indicator').should('be.visible');

    // 4. Trigger SignalR event manually
    cy.triggerSignalR('GameStarted', {});
    
    // 5. Assert navigation
    cy.url().should('include', '/game/ABCD');
});

});
