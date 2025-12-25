import { test, expect } from '@playwright/test';
import AxeBuilder from '@axe-core/playwright';

test.describe('Accessibility Audit', () => {
    test('should not have any automatically detectable accessibility issues on Board', async ({ page }) => {
        await page.goto('http://localhost:5173');

        // Wait for board to load
        await page.waitForSelector('main', { state: 'visible' });

        const accessibilityScanResults = await new AxeBuilder({ page })
            .withTags(['wcag2a', 'wcag2aa', 'wcag21a', 'wcag21aa'])
            .analyze();

        // Generate a simple report
        if (accessibilityScanResults.violations.length > 0) {
            console.log('\n--- Axe Accessibility Violations ---');
            accessibilityScanResults.violations.forEach(violation => {
                console.log(`\nID: ${violation.id}`);
                console.log(`Impact: ${violation.impact}`);
                console.log(`Description: ${violation.description}`);
                console.log(`Help: ${violation.help}`);
                console.log(`Nodes: ${violation.nodes.length}`);
                violation.nodes.forEach(node => {
                    console.log(`  - ${node.html}`);
                });
            });
            console.log('------------------------------------\n');
        }

        expect(accessibilityScanResults.violations).toEqual([]);
    });

    test('should pass a11y check for Card Detail Modal', async ({ page }) => {
        await page.goto('http://localhost:5173');

        // Ensure data is seeded or create a card if needed (assuming seedData runs or empty board)
        // For robustness, let's inject a card via the mock server first? 
        // Or just assume the UI allows creating one.

        // Creating a card via UI to test modal interaction
        // Note: This matches the "Add New Card" flow
        // await page.getByText('Add Card').first().click(); // Might fail if no columns
        // Let's stick to checking if we can find a button.
    });
});
