import { Page } from '@playwright/test';

export async function triggerSignalR(page: Page, eventName: string, data: unknown): Promise<void> {
  await page.waitForFunction(
    () => !!(window as any).basta_mock_signalr?.trigger,
    { timeout: 15_000 }
  );
  await page.evaluate(
    ({ eventName, data }) => {
      (window as any).basta_mock_signalr.trigger(eventName, data);
    },
    { eventName, data }
  );
}
