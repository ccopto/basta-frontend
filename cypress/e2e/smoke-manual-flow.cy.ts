describe('Manual Flow Smoke Test', () => {
  it('should allow host to configure after guest joins', () => {
    const gameCode = 'ABCD';
    
    // 1. Mock API calls
    cy.intercept('POST', '**/api/games', {
      statusCode: 200,
      body: { gameCode: gameCode, hostUserId: 1 }
    }).as('createGame');

    cy.intercept('GET', `**/api/games/${gameCode}`, {
      statusCode: 200,
      body: {
        gameCode: gameCode,
        totalRounds: 5,
        timerDuration: 60,
        language: 'en',
        state: 'Lobby',
        players: [{ userId: 1, nickname: 'Host', isHost: true, isOnline: true, score: 0 }],
        selectedCategoryIds: [1],
        hostUserId: 1
      }
    }).as('getGame');

    cy.intercept('GET', '**/api/categories*', {
      statusCode: 200,
      body: [
        { categoryId: 1, name: 'Fruits' },
        { categoryId: 2, name: 'Animals' }
      ]
    }).as('getCategories');

    // 2. Visit Home
    cy.visit('/home');
    cy.get('input[formControlName="nickname"]').type('Host');
    cy.contains('Create Game').click();
    
    cy.wait('@createGame');
    
    // Host is in Lobby
    cy.url().should('include', `/lobby/${gameCode}`);
    
    // Initial state: only host, button disabled
    cy.get('.host-controls button').should('be.disabled');
    
    // Simulate guest joining via SignalR
    cy.triggerSignalR('ReceiveLobbyUpdate', {
        gameCode: gameCode,
        totalRounds: 5,
        timerDuration: 60,
        language: 'en',
        state: 'Lobby',
        players: [
            { userId: 1, nickname: 'Host', isHost: true, isOnline: true, score: 0 },
            { userId: 2, nickname: 'Guest', isHost: false, isOnline: true, score: 0 }
        ],
        selectedCategoryIds: [1],
        hostUserId: 1
    });
    
    // Button should enable after guest joins
    cy.get('.host-controls button').should('not.be.disabled').click();
    
    // Navigate to setup
    cy.url().should('include', `/setup/${gameCode}`);
    
    // Wait for data load in setup
    cy.wait('@getGame');
    cy.wait('@getCategories');
    
    cy.get('.setup-form', { timeout: 10000 }).should('be.visible');
  });
});
