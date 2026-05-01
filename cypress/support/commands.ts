/// <reference types="cypress" />

Cypress.Commands.add('triggerSignalR', (eventName: string, data: any) => {
    // Poll the window for the mock object to ensure it is initialized
    cy.window().its('basta_mock_signalr', { timeout: 10000 }).should('exist').then((mock: any) => {
        mock.trigger(eventName, data);
    });
});

declare namespace Cypress {
    interface Chainable {
        triggerSignalR(eventName: string, data: any): Chainable<void>;
    }
}
