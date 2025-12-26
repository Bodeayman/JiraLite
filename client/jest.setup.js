import 'fake-indexeddb/auto';
import '@testing-library/jest-dom';

global.structuredClone = (val) => JSON.parse(JSON.stringify(val));

// Basic fetch mock
global.fetch = jest.fn(() => Promise.resolve({
    ok: true,
    json: () => Promise.resolve([])
}));

// Mock uuid globally to avoid ESM issues in tests
jest.mock('uuid', () => ({
    v4: () => 'test-uuid-' + Math.random().toString(36).substr(2, 9)
}));
