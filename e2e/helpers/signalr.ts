import { Page } from '@playwright/test';

export async function triggerSignalR(page: Page, eventName: string, data: unknown): Promise<void> {
  await page.waitForFunction(
    ({ eventName, data }) => {
      const mock = (window as any).basta_mock_signalr;
      if (!mock?.trigger) return false;
      mock.trigger(eventName, data);
      return true;
    },
    { eventName, data },
    { timeout: 15_000 }
  );
}
