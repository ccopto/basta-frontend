describe('Lobby Smoke Test - Guest', () => {
  beforeEach(() => {
    // 1. Mock Storage/Auth state as a Guest
    const initialState = JSON.stringify({
        userId: 2, nickname: 'Guest', isHost: false, gameCode: 'ABCD'
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
              { userId: 1, nickname: 'Host', isHost: true, isOnline: true, totalScore: 0 },
              { userId: 2, nickname: 'Guest', isHost: false, isOnline: true, totalScore: 0 }
            ],
            selectedCategoryIds: [1],
            hostUserId: 1
        }
    }).as('getLobby');
    
    cy.visit('/lobby/ABCD', {
        onBeforeLoad: (win) => {
            win.sessionStorage.setItem('basta_player_state', initialState);
        }
    });
    cy.wait('@getLobby');
  });

  it('should display waiting indicator and navigate on GameStarted', () => {
    // 3. Verify Lobby is visible and loaded
    cy.get('[data-cy="lobby-loaded"]', { timeout: 15000 }).should('be.visible');
    cy.get('[data-cy="player-item"]', { timeout: 10000 }).should('have.length.at.least', 2);
    cy.get('.waiting-indicator', { timeout: 10000 }).should('be.visible');

    // 4. Trigger SignalR event manually
    cy.triggerSignalR('GameStarted', {});
    
    // 5. Assert navigation
    cy.url().should('include', '/game/ABCD');
  });
});
});
