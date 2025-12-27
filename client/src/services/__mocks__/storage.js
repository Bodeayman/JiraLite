// src/services/__mocks__/storage.js

// Mock all storage functions that are used in your app
export const loadBoard = jest.fn(() => Promise.resolve({ columns: [] }));
export const saveBoard = jest.fn(() => Promise.resolve());
export const saveList = jest.fn(() => Promise.resolve());
export const saveCard = jest.fn(() => Promise.resolve());
export const deleteCard = jest.fn(() => Promise.resolve());
export const deleteList = jest.fn(() => Promise.resolve());
export const getQueue = jest.fn(() => Promise.resolve([]));
export const saveToQueue = jest.fn(() => Promise.resolve());
export const removeFromQueue = jest.fn(() => Promise.resolve());
export const clearQueue = jest.fn(() => Promise.resolve());
export const initDB = jest.fn(() => Promise.resolve());

const mockStorage = {
    loadBoard,
    saveBoard,
    saveList,
    saveCard,
    deleteCard,
    deleteList,
    getQueue,
    saveToQueue,
    removeFromQueue,
    clearQueue,
    initDB,
};

export default mockStorage;