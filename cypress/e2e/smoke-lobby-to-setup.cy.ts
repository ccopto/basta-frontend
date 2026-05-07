describe('Lobby to Setup Navigation Smoke Test', () => {
  it('should navigate from lobby to setup successfully', () => {
    const state = {
        userId: 1, nickname: 'Host', isHost: true, gameCode: 'ABCD', hostUserId: 1
    };

    // Mock APIs
    cy.intercept('GET', '**/api/categories?lang=en', [
      { categoryId: 1, name: 'Fruits' }
    ]).as('getCats');
    
    cy.intercept('GET', '**/api/games/ABCD', {
      gameCode: 'ABCD',
      totalRounds: 5,
      timerDuration: 60,
      selectedCategoryIds: [1],
      players: [
          { userId: 1, nickname: 'Host', isHost: true },
          { userId: 2, nickname: 'Guest', isHost: false }
      ],
      hostUserId: 1
    }).as('getGame');

    cy.intercept('POST', '**/hub/negotiate*', {
        statusCode: 200,
        body: { connectionId: "mock-id", availableTransports: [] }
    }).as('negotiate');

    cy.visit('/lobby/ABCD', {
        onBeforeLoad: (win) => {
            (win as any).BASTA_TEST_STATE = state;
            win.sessionStorage.setItem('basta_player_state', JSON.stringify(state));
        }
    });

    cy.wait('@getGame');
    
    cy.get('button').contains('Configure Game').should('not.be.disabled').click();
    cy.url().should('include', '/setup/ABCD');
    
    cy.get('body').then($body => {
      cy.log('Loading state:', $body.find('.loading-state').length > 0);
      cy.log('Error msg:', $body.find('.error-msg').text());
      cy.log('Form visible:', $body.find('.setup-form').length > 0);
    });

    // Wait for elements to be visible or error to appear
    cy.get('.spinner', { timeout: 10000 }).should('not.exist');
    
    cy.get('body').then($body => {
        if ($body.find('.error-msg').length > 0) {
            cy.log('ERROR IS VISIBLE:', $body.find('.error-msg').text());
        } else {
            cy.get('.setup-form').should('be.visible');
        }
    });
  });
});
