import { renderHook, act } from '@testing-library/react';
import { useBoardState } from './useBoardState';
import { BoardProvider } from '../context/BoardProvider';
import { boardReducer, initialState } from '../context/boardReducer';

// Mock uuid
jest.mock('uuid', () => ({
    v4: jest.fn(() => 'mock-uuid-123'),
}));

// Mock storage service
jest.mock('../services/storage', () => ({
    loadBoard: jest.fn(() => Promise.resolve({ columns: [] })),
    saveList: jest.fn(() => Promise.resolve()),
    saveCard: jest.fn(() => Promise.resolve()),
    deleteCard: jest.fn(() => Promise.resolve()),
    deleteList: jest.fn(() => Promise.resolve()),
    updateListsOrder: jest.fn(() => Promise.resolve()),
    updateCardsOrder: jest.fn(() => Promise.resolve()),
    getQueue: jest.fn(() => Promise.resolve([])),
    addToQueue: jest.fn(() => Promise.resolve()),
    removeFromQueue: jest.fn(() => Promise.resolve()),
    clearQueue: jest.fn(() => Promise.resolve()),
}));

/**
 * Wrapper component for testing hooks that require BoardProvider
 */
const wrapper = ({ children }) => (
    <BoardProvider>{children}</BoardProvider>
);

describe('useBoardState', () => {
    beforeEach(() => {
        jest.clearAllMocks();
    });

    test('should return columns and action functions', async () => {
        const { result } = renderHook(() => useBoardState(), { wrapper });
        // Wait for initial load
        await act(async () => { await new Promise(resolve => setTimeout(resolve, 0)); });

        expect(result.current.columns).toBeDefined();
        expect(Array.isArray(result.current.columns)).toBe(true);
        expect(result.current.addList).toBeDefined();
        expect(result.current.addCard).toBeDefined();
        expect(result.current.updateCard).toBeDefined();
        expect(result.current.deleteCard).toBeDefined();
        expect(result.current.editListTitle).toBeDefined();
        expect(result.current.archiveList).toBeDefined();
        expect(result.current.moveList).toBeDefined();
        expect(result.current.moveCard).toBeDefined();
        expect(result.current.findCardById).toBeDefined();
        expect(result.current.findListById).toBeDefined();
    });

    test('should add a new list', async () => {
        const { result } = renderHook(() => useBoardState(), { wrapper });
        // Wait for initial load
        await act(async () => { await new Promise(resolve => setTimeout(resolve, 0)); });

        // Wait for initial load
        await act(async () => {
            await new Promise(resolve => setTimeout(resolve, 0));
        });

        await act(async () => {
            result.current.addList('New List');
        });

        // Wait for state update
        await act(async () => {
            await new Promise(resolve => setTimeout(resolve, 0));
        });

        const list = result.current.columns.find(col => col.title === 'New List');
        expect(list).toBeDefined();
    });

    test('should not add list with empty title', async () => {
        const { result } = renderHook(() => useBoardState(), { wrapper });
        // Wait for initial load
        await act(async () => { await new Promise(resolve => setTimeout(resolve, 0)); });
        const initialLength = result.current.columns.length;

        await act(async () => {
            result.current.addList('');
        });

        await act(async () => {
            await new Promise(resolve => setTimeout(resolve, 100));
        });

        // Should not add empty list
        expect(result.current.columns.length).toBe(initialLength);
    });

    test('should add a card to a list', async () => {
        const { result } = renderHook(() => useBoardState(), { wrapper });
        // Wait for initial load
        await act(async () => { await new Promise(resolve => setTimeout(resolve, 0)); });

        // First, add a list
        await act(async () => {
            result.current.addList('Test List');
        });

        await act(async () => {
            await new Promise(resolve => setTimeout(resolve, 100));
        });

        const testList = result.current.columns.find(col => col.title === 'Test List');
        expect(testList).toBeDefined();

        // Then add a card
        await act(async () => {
            const cardId = result.current.addCard(testList.id, 'New Card');
            expect(cardId).toBe('mock-uuid-123');
        });

        await act(async () => {
            await new Promise(resolve => setTimeout(resolve, 100));
        });

        const updatedList = result.current.findListById(testList.id);
        expect(updatedList.cards.length).toBeGreaterThan(0);
        expect(updatedList.cards[0].title).toBe('New Card');
    });

    test('should update a card', async () => {
        const { result } = renderHook(() => useBoardState(), { wrapper });
        // Wait for initial load
        await act(async () => { await new Promise(resolve => setTimeout(resolve, 0)); });

        // Setup: Add list and card
        await act(async () => {
            result.current.addList('Test List');
        });

        await act(async () => {
            await new Promise(resolve => setTimeout(resolve, 100));
        });

        const testList = result.current.columns.find(col => col.title === 'Test List');

        await act(async () => {
            result.current.addCard(testList.id, 'Original Card');
        });

        await act(async () => {
            await new Promise(resolve => setTimeout(resolve, 100));
        });

        const card = result.current.findCardById('mock-uuid-123');
        expect(card).toBeDefined();

        // Update the card
        await act(async () => {
            result.current.updateCard(card.id, {
                title: 'Updated Card',
                description: 'New description',
            });
        });

        await act(async () => {
            await new Promise(resolve => setTimeout(resolve, 100));
        });

        const updatedCard = result.current.findCardById(card.id);
        expect(updatedCard.title).toBe('Updated Card');
        expect(updatedCard.description).toBe('New description');
    });

    test('should delete a card', async () => {
        const { result } = renderHook(() => useBoardState(), { wrapper });
        // Wait for initial load
        await act(async () => { await new Promise(resolve => setTimeout(resolve, 0)); });

        // Setup: Add list and card
        await act(async () => {
            result.current.addList('Test List');
        });

        await act(async () => {
            await new Promise(resolve => setTimeout(resolve, 100));
        });

        const testList = result.current.columns.find(col => col.title === 'Test List');

        await act(async () => {
            result.current.addCard(testList.id, 'Card to Delete');
        });

        await act(async () => {
            await new Promise(resolve => setTimeout(resolve, 100));
        });

        const card = result.current.findCardById('mock-uuid-123');
        expect(card).toBeDefined();

        // Delete the card
        await act(async () => {
            result.current.deleteCard(card.id);
        });

        await act(async () => {
            await new Promise(resolve => setTimeout(resolve, 100));
        });

        const deletedCard = result.current.findCardById(card.id);
        expect(deletedCard).toBeNull();
    });

    test('should edit list title', async () => {
        const { result } = renderHook(() => useBoardState(), { wrapper });
        // Wait for initial load
        await act(async () => { await new Promise(resolve => setTimeout(resolve, 0)); });

        // Setup: Add list
        await act(async () => {
            result.current.addList('Original Title');
        });

        await act(async () => {
            await new Promise(resolve => setTimeout(resolve, 100));
        });

        const testList = result.current.columns.find(col => col.title === 'Original Title');
        expect(testList).toBeDefined();

        // Edit title
        await act(async () => {
            result.current.editListTitle(testList.id, 'New Title');
        });

        await act(async () => {
            await new Promise(resolve => setTimeout(resolve, 100));
        });

        const updatedList = result.current.findListById(testList.id);
        expect(updatedList.title).toBe('New Title');
    });

    test('should archive a list', async () => {
        const { result } = renderHook(() => useBoardState(), { wrapper });
        // Wait for initial load
        await act(async () => { await new Promise(resolve => setTimeout(resolve, 0)); });

        // Setup: Add list
        await act(async () => {
            result.current.addList('List to Archive');
        });

        await act(async () => {
            await new Promise(resolve => setTimeout(resolve, 100));
        });

        const testList = result.current.columns.find(col => col.title === 'List to Archive');
        expect(testList).toBeDefined();
        const initialLength = result.current.columns.length;

        // Archive the list
        await act(async () => {
            result.current.archiveList(testList.id);
        });

        await act(async () => {
            await new Promise(resolve => setTimeout(resolve, 100));
        });

        expect(result.current.columns.length).toBe(initialLength - 1);
        const archivedList = result.current.findListById(testList.id);
        expect(archivedList).toBeNull();
    });

    test('should find card by ID', async () => {
        const { result } = renderHook(() => useBoardState(), { wrapper });
        // Wait for initial load
        await act(async () => { await new Promise(resolve => setTimeout(resolve, 0)); });

        // Setup: Add list and card
        await act(async () => {
            result.current.addList('Test List');
        });

        await act(async () => {
            await new Promise(resolve => setTimeout(resolve, 100));
        });

        const testList = result.current.columns.find(col => col.title === 'Test List');

        await act(async () => {
            result.current.addCard(testList.id, 'Test Card');
        });

        await act(async () => {
            await new Promise(resolve => setTimeout(resolve, 100));
        });

        const card = result.current.findCardById('mock-uuid-123');
        expect(card).toBeDefined();
        expect(card.title).toBe('Test Card');
    });

    test('should find list by ID', async () => {
        const { result } = renderHook(() => useBoardState(), { wrapper });
        // Wait for initial load
        await act(async () => { await new Promise(resolve => setTimeout(resolve, 0)); });

        // Setup: Add list
        await act(async () => {
            result.current.addList('Test List');
        });

        await act(async () => {
            await new Promise(resolve => setTimeout(resolve, 100));
        });

        const testList = result.current.columns.find(col => col.title === 'Test List');
        const foundList = result.current.findListById(testList.id);

        expect(foundList).toBeDefined();
        expect(foundList.id).toBe(testList.id);
        expect(foundList.title).toBe('Test List');
    });

    test('should return null for non-existent card', async () => {
        const { result } = renderHook(() => useBoardState(), { wrapper });
        // Wait for initial load
        await act(async () => { await new Promise(resolve => setTimeout(resolve, 0)); });
        const card = result.current.findCardById('non-existent-id');
        expect(card).toBeNull();
    });

    test('should return null for non-existent list', async () => {
        const { result } = renderHook(() => useBoardState(), { wrapper });
        const list = result.current.findListById('non-existent-id');
        expect(list).toBeNull();
    });
});

