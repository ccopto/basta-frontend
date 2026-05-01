describe('Lobby Smoke Test', () => {
  beforeEach(() => {
    cy.visit('/');
  });

  it('should join game and trigger SignalR event', () => {
    // 1. Mock API responses
    cy.intercept('POST', '**/api/games/ABCD/join', {
        statusCode: 200,
        body: { userId: 1, gameCode: 'ABCD' }
    });
    
    // REQUIRED: Mock initial state fetch
    cy.intercept('GET', '**/api/games/ABCD', {
        statusCode: 200,
        body: {
            gameCode: 'ABCD',
            totalRounds: 5,
            timerDuration: 60,
            language: 'en',
            state: 'Lobby',
            players: [{ userId: 1, nickname: 'Host', isHost: true, isOnline: true }],
            selectedCategoryIds: [1],
            hostUserId: 1
        }
    });
    
    // 2. Perform Join Action
    cy.contains('Join Existing Game').click();
    cy.get('input#joinNickname').type('Nick');
    cy.get('input#gameCode').type('ABCD');
    cy.contains('Join Game').click();

    // 3. Verify transition to Lobby
    cy.url().should('include', '/lobby/ABCD');

    // 4. Trigger SignalR event manually
    cy.triggerSignalR('GameStarted', {});
    
    // 5. Assert navigation
    cy.url().should('include', '/game/ABCD');
  });
});
