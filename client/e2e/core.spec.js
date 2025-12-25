// @ts-check
const { test, expect } = require('@playwright/test');

test.describe('Core Board Flow', () => {
    test.beforeEach(async ({ page }) => {
        await page.goto('http://localhost:5173');
        // Wait for initial load
        await page.waitForTimeout(1000);
    });

    test('should create list, add card, and handle offline mode', async ({ page, context }) => {
        // 1. Create a List
        const listTitle = `List-${Date.now()}`;
        await page.getByPlaceholder('Enter list title...').fill(listTitle);
        await page.getByRole('button', { name: 'Add List' }).click();

        // Verify List
        await expect(page.getByText(listTitle)).toBeVisible();

        // 2. Add a Card
        await page.getByRole('button', { name: 'Add Card' }).first().click(); // Assumes new list is first or we target specific list

        // Fill Card Modal
        const cardTitle = 'Online Card';
        await page.getByPlaceholder('Enter card title...').fill(cardTitle);
        await page.getByPlaceholder('Enter description...').fill('Created while online');
        // Save
        await page.getByRole('button', { name: 'Add Card' }).nth(1).click(); // There might be multiple 'Add Card' texts (button inside modal)

        // Verify Card
        await expect(page.getByText(cardTitle)).toBeVisible();

        // 3. Offline Mode
        await context.setOffline(true);

        // Add Offline Card
        const offlineCardTitle = 'Offline Card';
        // Click Add Card on the same list again
        // We need to be careful with selectors if UI changed.
        // Assuming the "Add Card" button is still visible on the list.
        await page.getByRole('button', { name: 'Add Card' }).first().click();

        await page.getByPlaceholder('Enter card title...').fill(offlineCardTitle);
        await page.getByRole('button', { name: 'Add Card' }).nth(1).click(); // Save in modal

        // Verify Optimistic UI
        await expect(page.getByText(offlineCardTitle)).toBeVisible();

        // 4. Back Online
        await context.setOffline(false);

        // Wait for sync (simulate network latency)
        await page.waitForTimeout(2000);

        // Reload match not required given React state, but testing persistence:
        await page.reload();
        await expect(page.getByText(listTitle)).toBeVisible();
        await expect(page.getByText(cardTitle)).toBeVisible();
        await expect(page.getByText(offlineCardTitle)).toBeVisible();
    });
});
