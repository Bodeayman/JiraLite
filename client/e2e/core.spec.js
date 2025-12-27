// @ts-check
import { test, expect } from '@playwright/test';

test.describe('Core Board Flow', () => {
    test.beforeEach(async ({ page }) => {
        await page.goto('http://localhost:5173');
        // Wait for initial load
        await page.waitForTimeout(1000);
    });

    test('should create list and verify persistence', async ({ page }) => {
        const listTitle = `TestList-${Date.now()}`;
        await page.getByPlaceholder('List name').fill(listTitle);
        await page.getByRole('button', { name: 'Create List' }).click();

        // Wait until the list is actually visible
        const listLocator = page.getByText(listTitle);
        await listLocator.waitFor({ state: 'visible', timeout: 5000 });
        expect(await listLocator.isVisible()).toBe(true);

        await page.reload();
        const listLocatorAfterReload = page.getByText(listTitle);
        await listLocatorAfterReload.waitFor({ state: 'visible', timeout: 5000 });
        expect(await listLocatorAfterReload.isVisible()).toBe(true);
    });

    test('should handle offline mode with optimistic UI', async ({ page, context }) => {
        const onlineListTitle = `OnlineList-${Date.now()}`;
        await page.getByPlaceholder('List name').fill(onlineListTitle);
        await page.getByRole('button', { name: 'Create List' }).click();
        await page.getByText(onlineListTitle).waitFor({ state: 'visible', timeout: 5000 });

        // Go offline
        await context.setOffline(true);

        const offlineListTitle = `OfflineList-${Date.now()}`;
        await page.getByPlaceholder('List name').fill(offlineListTitle);
        await page.getByRole('button', { name: 'Create List' }).click();

        // Wait for optimistic UI to render
        const offlineListLocator = page.getByText(offlineListTitle);
        await offlineListLocator.waitFor({ state: 'visible', timeout: 5000 });
        expect(await offlineListLocator.isVisible()).toBe(true);

        // Go back online and wait for sync
        await context.setOffline(false);
        await page.waitForTimeout(2000);

        await page.reload();
        await page.getByText(onlineListTitle).waitFor({ state: 'visible', timeout: 5000 });
        await page.getByText(offlineListTitle).waitFor({ state: 'visible', timeout: 5000 });
    });
});
