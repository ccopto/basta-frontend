/// <reference types="cypress" />

Cypress.Commands.add('triggerSignalR', (eventName: string, data: any) => {
    cy.window().then((win: any) => {
        if (win.basta_mock_signalr) {
            win.basta_mock_signalr.trigger(eventName, data);
        } else {
            throw new Error('SignalR mock not initialized on window.basta_mock_signalr');
        }
    });
});

declare namespace Cypress {
    interface Chainable {
        triggerSignalR(eventName: string, data: any): Chainable<void>;
    }
}
