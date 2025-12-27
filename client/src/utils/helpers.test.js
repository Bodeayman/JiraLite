import { generateId, formatDate, truncateText } from './helpers';

describe('helpers', () => {
    describe('generateId', () => {
        test('generates unique IDs', () => {
            const id1 = generateId();
            const id2 = generateId();
            expect(id1).not.toBe(id2);
            expect(typeof id1).toBe('string');
        });
    });

    describe('formatDate', () => {
        test('formats date correctly', () => {
            const date = new Date('2025-01-01');
            const formatted = formatDate(date);
            expect(formatted).toContain('2025');
        });

        test('handles null date', () => {
            expect(formatDate(null)).toBe('');
        });

        test('handles undefined date', () => {
            expect(formatDate(undefined)).toBe('');
        });
    });

    describe('truncateText', () => {
        test('truncates long text', () => {
            const text = 'This is a very long text';
            const truncated = truncateText(text, 10);
            expect(truncated.length).toBeLessThanOrEqual(13);
            expect(truncated).toContain('...');
        });

        test('does not truncate short text', () => {
            const text = 'Short';
            expect(truncateText(text, 10)).toBe(text);
        });

        test('handles empty text', () => {
            expect(truncateText('', 10)).toBe('');
        });

        test('handles null text', () => {
            expect(truncateText(null, 10)).toBe('');
        });
    });
});