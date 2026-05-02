describe('Lobby Smoke Test - Host', () => {
  beforeEach(() => {
    // 1. Mock Storage/Auth state as Host
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
    
    // Wait for mock
    cy.window().its('basta_mock_signalr', { timeout: 15000 }).should('exist');
    
    // Wait for API
    cy.wait('@getLobby', { timeout: 20000 });
  });

  afterEach(() => {
    cy.window().then((win) => {
      (win as any).BASTA_TEST_STATE = null;
    });
  });

  it('should show configure game controls for host', () => {
    // 3. Assert Host Controls
    cy.url().should('include', '/lobby/ABCD');
    cy.get('[data-cy="lobby-loaded"]', { timeout: 15000 }).should('exist');
    cy.get('.host-controls', { timeout: 10000 }).should('be.visible');
    
    cy.contains('Configure Game').should('not.be.disabled').click();
    
    // 4. Assert navigation
    cy.url().should('include', '/setup/ABCD');
  });
});
