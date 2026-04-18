describe('Gameplay Flow (US-04)', () => {
  beforeEach(() => {
    cy.visit('/');
  });

  it('should successfully join a game and see the game UI', () => {
    // 1. Mock the API responses
    cy.intercept('GET', '**/api/games/ABCD', {
      statusCode: 200,
      body: {
        gameCode: 'ABCD',
        hostNickname: 'HostUser',
        status: 'Lobby',
        selectedCategoryIds: [1, 2, 3]
      }
    }).as('getGame');

    cy.intercept('POST', '**/api/games/ABCD/join', {
        statusCode: 200,
        body: {
          userId: 456,
          gameCode: 'ABCD'
        }
    }).as('joinGame');

    cy.intercept('GET', '**/api/games/categories', {
        statusCode: 200,
        body: [
            { categoryId: 1, name: 'Fruits' },
            { categoryId: 2, name: 'Countries' },
            { categoryId: 3, name: 'Brands' }
        ]
    }).as('getCategories');

    // 2. Perform Join Action
    cy.get('input#nickname').type('GuestUser');
    cy.get('input#gameCode').type('ABCD');
    cy.contains('Join Game').click();

    // 3. Verify transition to Game page (GameGuard logic check)
    // Note: In real app, it goes to Lobby first, but let's assume US-04 flow
    cy.url().should('include', '/game/ABCD');

    // 4. Verify Categories are loaded
    cy.wait(['@getGame', '@getCategories']);
    cy.contains('Fruits').should('be.visible');
    cy.contains('Countries').should('be.visible');
    cy.contains('Brands').should('be.visible');

    // 5. Verify initial timer state
    cy.contains('00:00').should('be.visible');
  });
});
