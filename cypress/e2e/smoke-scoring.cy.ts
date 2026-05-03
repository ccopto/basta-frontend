describe('Scoring Smoke Test', () => {
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

  it('should display validation and results phases', () => {
    // 4. Trigger Validation Phase
    cy.triggerSignalR('DisplayScoring', {
      players: [
        {
          userId: 1,
          nickname: 'Host',
          answers: { 1: 'Mango' }
        }
      ]
    });

    // 5. Assert Validation UI
    // app-validation-grid component is rendered in the 'validating' case
    cy.get('app-validation-grid').should('exist');

    // 6. Trigger Results Phase
    cy.triggerSignalR('ReceiveGameScore', [
      {
        userId: 1,
        nickname: 'Host',
        roundScore: 10,
        cumulativeScore: 10,
        answers: []
      }
    ]);

    // 7. Assert Results UI
    cy.get('app-round-results').should('be.visible');
    cy.contains('10').should('be.visible'); 
  });
});
