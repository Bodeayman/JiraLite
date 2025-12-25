import 'fake-indexeddb/auto';
import '@testing-library/jest-dom';

global.structuredClone = (val) => JSON.parse(JSON.stringify(val));
global.fetch = jest.fn(() => Promise.resolve({
    ok: true,
    json: () => Promise.resolve({ columns: [] })
}));
