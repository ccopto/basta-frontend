describe('Lobby Smoke Test - Sync', () => {
  beforeEach(() => {
    // 1. Mock Storage/Auth state as Host already in lobby
    const initialState = JSON.stringify({
        userId: 1, 
        nickname: 'Host', 
        isHost: true, 
        gameCode: 'ABCD',
        selectedCategoryIds: [1],
        totalRounds: 5,
        timerDuration: 60,
        hostUserId: 1
    });

    // 2. Mock APIs
    cy.intercept('GET', '**/api/categories?lang=en', [
      { categoryId: 1, name: 'Fruits' }
    ]).as('getCats');

    // Initial load: Only the host is in the lobby
    cy.intercept('GET', '**/api/games/ABCD', {
        statusCode: 200,
        body: {
            gameCode: 'ABCD',
            totalRounds: 5,
            timerDuration: 60,
            language: 'en',
            state: 'Lobby',
            players: [
              { userId: 1, nickname: 'Host', isHost: true, isOnline: true, totalScore: 0 }
            ],
            selectedCategoryIds: [1],
            hostUserId: 1
        }
    }).as('getLobby');
    
    // Visit with storage setup
    cy.visit('/lobby/ABCD', {
        onBeforeLoad: (win) => {
            (win as any).BASTA_TEST_STATE = JSON.parse(initialState);
            win.sessionStorage.setItem('basta_player_state', initialState);
        }
    });
    
    // Wait for the SignalR mock to be available in the window
    cy.window().its('basta_mock_signalr', { timeout: 15000 }).should('exist');
    
    // Wait for the API call from the page
    cy.wait('@getLobby', { timeout: 20000 });
  });

  afterEach(() => {
    cy.window().then((win) => {
      (win as any).BASTA_TEST_STATE = null;
    });
  });

  it('should update the UI when a guest joins via SignalR', () => {
    // Verify Lobby is loaded with just the Host
    cy.url().should('include', '/lobby/ABCD');
    cy.get('[data-cy="lobby-loaded"]', { timeout: 15000 }).should('exist');
    
    // Assert only Host is present initially
    cy.get('[data-cy="player-item"]').should('have.length', 1);
    cy.get('[data-cy="player-item"]').first().should('contain.text', 'Host');
    
    // Guest joins in another browser, server broadcasts ReceiveLobbyUpdate
    const updatedLobbyPayload = {
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
    };

    // Trigger SignalR event
    cy.triggerSignalR('ReceiveLobbyUpdate', updatedLobbyPayload);
    
    // Assert that the UI updates reactively
    cy.get('[data-cy="player-item"]', { timeout: 10000 }).should('have.length', 2);
    cy.get('[data-cy="player-item"]').eq(1).should('contain.text', 'Guest');
  });
});
