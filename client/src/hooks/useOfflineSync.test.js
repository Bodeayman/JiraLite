import { renderHook, act, waitFor } from '@testing-library/react';
import { useOfflineSync } from './useOfflineSync';
import * as storageService from '../services/storage';
import * as apiService from '../services/api';

// Mock storage service
jest.mock('../services/storage', () => ({
    saveList: jest.fn(() => Promise.resolve()),
    saveCard: jest.fn(() => Promise.resolve()),
    deleteCard: jest.fn(() => Promise.resolve()),
    deleteList: jest.fn(() => Promise.resolve()),
    updateListsOrder: jest.fn(() => Promise.resolve()),
    updateCardsOrder: jest.fn(() => Promise.resolve()),
}));

// Mock API service (empty by default)
jest.mock('../services/api', () => ({}));

describe('useOfflineSync', () => {
    beforeEach(() => {
        jest.clearAllMocks();
        // Mock navigator.onLine
        Object.defineProperty(navigator, 'onLine', {
            writable: true,
            configurable: true,
            value: true,
        });
    });

    test('should initialize with empty queue and online status', () => {
        const { result } = renderHook(() => useOfflineSync());

        expect(result.current.syncQueue).toEqual([]);
        expect(result.current.isOnline).toBe(true);
        expect(result.current.isSyncing).toBe(false);
        expect(result.current.retryCount).toBe(0);
    });

    test('should queue an operation', () => {
        const { result } = renderHook(() => useOfflineSync());

        act(() => {
            result.current.queueOperation({
                type: 'ADD_CARD',
                payload: { id: 'card-1', title: 'Test Card' },
            });
        });

        expect(result.current.syncQueue.length).toBe(1);
        expect(result.current.syncQueue[0].type).toBe('ADD_CARD');
    });

    test('should persist operation locally', async () => {
        const { result } = renderHook(() => useOfflineSync());

        act(() => {
            result.current.queueOperation({
                type: 'ADD_CARD',
                payload: { id: 'card-1', title: 'Test Card' },
            });
        });

        await waitFor(() => {
            expect(storageService.saveCard).toHaveBeenCalled();
        }, { timeout: 2000 });
    });

    test('should process queue when online', async () => {
        const { result } = renderHook(() => useOfflineSync());

        act(() => {
            result.current.queueOperation({
                type: 'ADD_CARD',
                payload: { id: 'card-1', title: 'Test Card' },
            });
        });

        await waitFor(() => {
            expect(result.current.syncQueue.length).toBe(0);
        }, { timeout: 2000 });
    });

    test('should handle offline status', () => {
        Object.defineProperty(navigator, 'onLine', {
            writable: true,
            configurable: true,
            value: false,
        });

        const { result } = renderHook(() => useOfflineSync());

        act(() => {
            window.dispatchEvent(new Event('offline'));
        });

        expect(result.current.isOnline).toBe(false);
    });

    test('should handle online status', () => {
        Object.defineProperty(navigator, 'onLine', {
            writable: true,
            configurable: true,
            value: true,
        });

        const { result } = renderHook(() => useOfflineSync());

        act(() => {
            window.dispatchEvent(new Event('online'));
        });

        expect(result.current.isOnline).toBe(true);
    });

    test('should clear queue', () => {
        const { result } = renderHook(() => useOfflineSync());

        act(() => {
            result.current.queueOperation({
                type: 'ADD_CARD',
                payload: { id: 'card-1', title: 'Test Card' },
            });
            result.current.queueOperation({
                type: 'UPDATE_CARD',
                payload: { id: 'card-1', updates: { title: 'Updated' } },
            });
        });

        expect(result.current.syncQueue.length).toBe(2);

        act(() => {
            result.current.clearQueue();
        });

        expect(result.current.syncQueue.length).toBe(0);
        expect(result.current.retryCount).toBe(0);
    });

    test('should handle retry on failure', async () => {
        // Mock storage to fail first time, then succeed
        let callCount = 0;
        storageService.saveCard.mockImplementation(() => {
            callCount++;
            if (callCount === 1) {
                return Promise.reject(new Error('Network error'));
            }
            return Promise.resolve();
        });

        const { result } = renderHook(() =>
            useOfflineSync({
                maxRetries: 2,
                retryDelay: 100, // Fast retry for testing
            })
        );

        act(() => {
            result.current.queueOperation({
                type: 'ADD_CARD',
                payload: { id: 'card-1', title: 'Test Card' },
            });
        });

        // Wait for retry
        await waitFor(() => {
            expect(storageService.saveCard).toHaveBeenCalledTimes(2);
        }, { timeout: 1000 });
    });

    test('should call onSyncSuccess callback', async () => {
        const onSyncSuccess = jest.fn();
        const { result } = renderHook(() =>
            useOfflineSync({ onSyncSuccess })
        );

        act(() => {
            result.current.queueOperation({
                type: 'ADD_CARD',
                payload: { id: 'card-1', title: 'Test Card' },
            });
        });

        await waitFor(() => {
            expect(onSyncSuccess).toHaveBeenCalled();
        }, { timeout: 2000 });
    });

    test('should prioritize operations by priority', () => {
        const { result } = renderHook(() => useOfflineSync());

        act(() => {
            result.current.queueOperation({
                type: 'ADD_CARD',
                payload: { id: 'card-1', title: 'Low Priority' },
                priority: 1,
            });
            result.current.queueOperation({
                type: 'UPDATE_CARD',
                payload: { id: 'card-2', updates: {} },
                priority: 10,
            });
            result.current.queueOperation({
                type: 'DELETE_CARD',
                payload: 'card-3',
                priority: 5,
            });
        });

        expect(result.current.syncQueue[0].priority).toBe(10);
        expect(result.current.syncQueue[1].priority).toBe(5);
        expect(result.current.syncQueue[2].priority).toBe(1);
    });

    test('should handle different operation types', async () => {
        const { result } = renderHook(() => useOfflineSync());

        act(() => {
            result.current.queueOperation({
                type: 'ADD_LIST',
                payload: { id: 'list-1', title: 'New List' },
            });
            result.current.queueOperation({
                type: 'DELETE_CARD',
                payload: 'card-1',
            });
            result.current.queueOperation({
                type: 'ARCHIVE_LIST',
                payload: 'list-1',
            });
        });

        await waitFor(() => {
            expect(storageService.saveList).toHaveBeenCalled();
            expect(storageService.deleteCard).toHaveBeenCalled();
            expect(storageService.deleteList).toHaveBeenCalled();
        }, { timeout: 2000 });
    });
});

