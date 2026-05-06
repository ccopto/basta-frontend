describe('Manual Flow Smoke Test', () => {
  it('should allow host to configure after guest joins', () => {
    // 1. Visit Home
    cy.visit('/home');
    cy.get('input[formControlName="nickname"]').type('Host');
    cy.intercept('POST', '**/api/games').as('createGame');
    cy.contains('Create Game').click();
    cy.wait('@createGame').then((interception) => {
        const gameCode = interception.response?.body.gameCode;
        
        // Host is in Lobby
        cy.url().should('include', `/lobby/${gameCode}`);
        cy.get('.host-controls button').should('be.disabled');
        
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
        
        // Button should enable
        cy.get('.host-controls button').should('not.be.disabled').click();
        
        // Navigate to setup
        cy.url().should('include', `/setup/${gameCode}`);
        cy.get('.setup-form', { timeout: 10000 }).should('be.visible');
    });
  });
});
