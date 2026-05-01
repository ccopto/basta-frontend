describe('Scoring Smoke Test', () => {
  beforeEach(() => {
    cy.visit('/game/ABCD');
  });

  it('should display validation and results phases', () => {
    // 1. Trigger Validation Phase
    cy.triggerSignalR('DisplayScoring', {
      players: [
        {
          userId: 1,
          nickname: 'Host',
          answers: { 1: 'Mango' }
        }
      ]
    });

    // 2. Assert Validation UI
    cy.contains('validating').should('exist'); // Assuming class or text indicator

    // 3. Trigger Results Phase
    cy.triggerSignalR('ReceiveGameScore', [
      {
        userId: 1,
        nickname: 'Host',
        roundScore: 10,
        cumulativeScore: 10,
        answers: []
      }
    ]);

    // 4. Assert Results UI
    cy.contains('10').should('be.visible'); // Score display
  });
});
