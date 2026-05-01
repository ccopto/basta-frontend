describe('Gameplay Smoke Test', () => {
  beforeEach(() => {
    // 1. Mock Storage/Auth state
    cy.window().then((win) => {
        win.sessionStorage.setItem('basta_player_state', JSON.stringify({
            userId: 1, nickname: 'Host', isHost: true, gameCode: 'ABCD'
        }));
    });

    // 2. Mock API endpoints
    cy.intercept('GET', '**/api/categories?lang=en', [
      { categoryId: 1, name: 'Fruits' }
    ]).as('getCats');
    cy.intercept('GET', '**/api/games/ABCD', {
      selectedCategoryIds: [1],
      gameCode: 'ABCD'
    }).as('getGame');

    // 3. Navigate and wait for init
    cy.visit('/game/ABCD');
    cy.wait(['@getCats', '@getGame']);
  });

  it('should start a round, show letter, and disable inputs on Basta call', () => {
    // 4. Trigger Start Round
    cy.triggerSignalR('RoundStarted', { 
        roundNumber: 1, 
        letter: 'M', 
        timerDuration: 60,
        serverTime: new Date().toISOString()
    });

    // 5. Assert UI state
    cy.contains('M').should('be.visible');
    cy.get('input').should('be.visible').and('not.be.disabled');
    cy.get('input').type('Mango');

    // 6. Trigger Basta!
    cy.triggerSignalR('RoundStopped', { callerNickname: 'Host' });
    cy.get('input').should('be.disabled');
  });
});
