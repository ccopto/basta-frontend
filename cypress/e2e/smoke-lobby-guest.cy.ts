describe('Lobby Smoke Test - Guest', () => {
  beforeEach(() => {
    // 1. Mock Storage/Auth state as a Guest
    const initialState = JSON.stringify({
        userId: 2, 
        nickname: 'Guest', 
        isHost: false, 
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

  it('should display waiting indicator and navigate on GameStarted', () => {
    // 3. Verify Lobby is visible and loaded
    cy.url().should('include', '/lobby/ABCD');
    cy.get('[data-cy="lobby-loaded"]', { timeout: 15000 }).should('exist');
    cy.get('.waiting-indicator', { timeout: 10000 }).should('exist');

    // 4. Trigger SignalR event manually
    cy.triggerSignalR('GameStarted', {});
    
    // 5. Assert navigation
    cy.url().should('include', '/game/ABCD');
  });
});
