describe('Create Game (US-01 / US-03)', () => {
  beforeEach(() => {
    // Navigate to the home page before each test
    cy.visit('/');
  });

  it('should render landing page correctly', () => {
    cy.contains('h1', 'Basta');
    cy.contains('label', 'Choose a Nickname');
    cy.get('button').contains('Create Game').should('be.disabled');
  });

  it('should show validation errors for empty nickname', () => {
    cy.get('input#nickname').type('   ').blur();
    cy.get('.error-msg').should('contain', 'Nickname is required');
    cy.get('button').contains('Create Game').should('be.disabled');
  });

  it('should successfully create a game and navigate', () => {
    // Intercept the backend POST request
    cy.intercept('POST', '**/api/games', {
      statusCode: 200,
      body: {
        gameCode: 'TEST',
        hostUserId: 123
      }
    }).as('createGame');

    // Clear session storage to start fresh
    cy.clearAllSessionStorage();

    // Type a valid nickname
    cy.get('input#nickname').clear().type('CypressUser');

    // The button should now be enabled, click it
    cy.get('button').contains('Create Game').should('not.be.disabled').click();

    // Verify the HTTP call was fired correctly
    cy.wait('@createGame').its('request.body').should('deep.equal', {
      hostNickname: 'CypressUser',
      preferredLanguage: 'en',
      totalRounds: 5,
      timerDuration: 60,
      categoryIds: [1]
    });

    // Verify the URL changed to the lobby route
    cy.url().should('include', '/lobby/TEST');

    // Verify sessionStorage holds the Host credentials via PlayerStateService parsing
    cy.window().then((win) => {
      const stateString = win.sessionStorage.getItem('basta_player_state');
      expect(stateString).to.not.be.null;
      const state = JSON.parse(stateString!);
      expect(state.nickname).to.equal('CypressUser');
      expect(state.isHost).to.be.true;
      expect(state.gameCode).to.equal('TEST');
      expect(state.userId).to.equal(123);
    });
  });
});
