import React from 'react';
import { render, waitFor } from '@testing-library/react';
import { axe, toHaveNoViolations } from 'jest-axe';
import App from './App';
import { BoardProvider } from './context/BoardProvider';

expect.extend(toHaveNoViolations);

// Mock all dependencies
jest.mock('./services/storage', () => ({
    loadBoard: jest.fn(() => Promise.resolve({
        title: 'My Board',
        columns: []
    })),
    saveBoard: jest.fn(() => Promise.resolve()),
    saveList: jest.fn(() => Promise.resolve()),
    saveCard: jest.fn(() => Promise.resolve()),
    deleteCard: jest.fn(() => Promise.resolve()),
    getQueue: jest.fn(() => Promise.resolve([])),
    saveToQueue: jest.fn(() => Promise.resolve()),
    removeFromQueue: jest.fn(() => Promise.resolve()),
}));

jest.mock('./hooks/useOfflineSync', () => ({
    useOfflineSync: () => ({
        syncStatus: 'idle',
        pendingCount: 0,
        conflicts: [],
        resolveConflict: jest.fn(),
    }),
}));

describe('Axe Accessibility Tests', () => {
    test('App has no critical/serious accessibility violations', async () => {
        // Suppress console errors during test
        const consoleSpy = jest.spyOn(console, 'error').mockImplementation(() => { });

        // Render App (which includes BoardProvider internally)
        const { container } = render(<BoardProvider>
            <App />
        </BoardProvider>);

        // Wait for board to be ready
        await waitFor(() => {
            const app = container.firstChild;
            expect(app).toBeTruthy();
        }, { timeout: 5000 });

        // Run axe with all rules
        const results = await axe(container);

        // Log all violations found
        if (results.violations.length > 0) {
            console.log('\n' + '='.repeat(70));
            console.log('ACCESSIBILITY VIOLATIONS FOUND');
            console.log('='.repeat(70) + '\n');

            // Group by severity
            const critical = results.violations.filter(v => v.impact === 'critical');
            const serious = results.violations.filter(v => v.impact === 'serious');
            const moderate = results.violations.filter(v => v.impact === 'moderate');
            const minor = results.violations.filter(v => v.impact === 'minor');

            console.log(` Summary:`);
            console.log(`    Critical: ${critical.length}`);
            console.log(`    Serious:  ${serious.length}`);
            console.log(`    Moderate: ${moderate.length}`);
            console.log(`    Minor:    ${minor.length}\n`);

            // Show critical and serious violations in detail
            [...critical, ...serious].forEach((violation, i) => {
                console.log(`\n${i + 1}. [${violation.impact.toUpperCase()}] ${violation.id}`);
                console.log(`   Description: ${violation.description}`);
                console.log(`   Help: ${violation.helpUrl}`);
                console.log(`   Affected: ${violation.nodes.length} element(s)\n`);

                violation.nodes.forEach((node, j) => {
                    console.log(`   Element ${j + 1}:`);
                    console.log(`   ${node.html.substring(0, 100)}...`);
                    console.log(`   Fix: ${node.failureSummary}\n`);
                });
            });

            console.log('='.repeat(70) + '\n');
        } else {
            console.log('\nNo accessibility violations found!\n');
        }

        consoleSpy.mockRestore();

        // Assert no violations
        expect(results).toHaveNoViolations();
    }, 30000);
});