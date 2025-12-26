// @ts-check
import { test, expect } from '@playwright/test';

test.describe('Core Board Flow', () => {
    test.beforeEach(async ({ page }) => {
        await page.goto('http://localhost:5173');
        // Wait for initial load
        await page.waitForTimeout(1000);
    });

    test('should create list and verify persistence', async ({ page }) => {
        // 1. Create a List
        const listTitle = `TestList-${Date.now()}`;
        await page.getByPlaceholder('List name').fill(listTitle);
        await page.getByRole('button', { name: 'Create List' }).click();

        // Verify List appears
        await expect(page.getByText(listTitle)).toBeVisible();

        // 2. Reload page to verify persistence
        await page.reload();
        await page.waitForTimeout(500);

        // List should still be visible after reload
        await expect(page.getByText(listTitle)).toBeVisible();
    });

    test('should handle offline mode with optimistic UI', async ({ page, context }) => {
        // 1. Create a list while online
        const onlineListTitle = `OnlineList-${Date.now()}`;
        await page.getByPlaceholder('List name').fill(onlineListTitle);
        await page.getByRole('button', { name: 'Create List' }).click();
        await expect(page.getByText(onlineListTitle)).toBeVisible();

        // 2. Go offline
        await context.setOffline(true);

        // 3. Create a list while offline (optimistic UI)
        const offlineListTitle = `OfflineList-${Date.now()}`;
        await page.getByPlaceholder('List name').fill(offlineListTitle);
        await page.getByRole('button', { name: 'Create List' }).click();

        // Verify optimistic UI shows the list immediately
        await expect(page.getByText(offlineListTitle)).toBeVisible();

        // 4. Go back online
        await context.setOffline(false);

        // Wait for sync
        await page.waitForTimeout(2000);

        // 5. Reload to verify both lists persisted
        await page.reload();
        await page.waitForTimeout(500);

        await expect(page.getByText(onlineListTitle)).toBeVisible();
        await expect(page.getByText(offlineListTitle)).toBeVisible();
    });
});
