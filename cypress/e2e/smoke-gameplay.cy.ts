describe('Gameplay Smoke Test', () => {
  beforeEach(() => {
    // Navigate directly to game page to test mechanics
    cy.visit('/game/ABCD');
  });

  it('should start a round, show letter, and disable inputs on Basta call', () => {
    // 1. Mock Category API
    cy.intercept('GET', '**/api/games/categories', [
      { categoryId: 1, name: 'Fruits' }
    ]);
    // 2. Mock Game API
    cy.intercept('GET', '**/api/games/ABCD', {
      selectedCategoryIds: [1],
      gameCode: 'ABCD'
    });

    // 3. Trigger Start Round
    cy.triggerSignalR('RoundStarted', { 
        roundNumber: 1, 
        letter: 'M', 
        timerDuration: 60,
        serverTime: new Date().toISOString()
    });

    // 4. Assert UI state
    cy.contains('M').should('be.visible');
    cy.get('input').should('be.visible').and('not.be.disabled');
    cy.get('input').type('Mango');

    // 5. Trigger Basta!
    cy.triggerSignalR('RoundStopped', { callerNickname: 'Host' });
    cy.get('input').should('be.disabled');
  });
});
