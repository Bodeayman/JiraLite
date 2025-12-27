import { renderHook, act } from '@testing-library/react';
import { useOfflineSync } from './useOfflineSync';
import * as storage from '../services/storage';
import { apiClient } from '../services/apiClient';

jest.mock('../services/storage');
jest.mock('../services/apiClient');

describe('useOfflineSync', () => {
    beforeEach(() => {
        jest.clearAllMocks();
        Object.defineProperty(navigator, 'onLine', { value: true, configurable: true });
    });

    test('initializes with navigator.onLine status', () => {
        Object.defineProperty(navigator, 'onLine', { value: false, configurable: true });
        const { result } = renderHook(() => useOfflineSync());
        expect(result.current.isOnline).toBe(false);
    });

    test('scheduleSync adds item to queue and processes if online', async () => {
        storage.addToQueue.mockResolvedValue(1);
        storage.getQueue.mockResolvedValue([{ key: 1, val: { type: 'ADD_LIST', payload: {} } }]);
        apiClient.createList.mockResolvedValue({});
        storage.removeFromQueue.mockResolvedValue();

        const { result } = renderHook(() => useOfflineSync());

        await act(async () => {
            await result.current.scheduleSync({ type: 'ADD_LIST', payload: {} });
        });

        expect(storage.addToQueue).toHaveBeenCalled();
        expect(apiClient.createList).toHaveBeenCalled();
        expect(storage.removeFromQueue).toHaveBeenCalledWith(1);
    });

    test('processes UPDATE_CARD operation', async () => {
        const operation = { type: 'UPDATE_CARD', payload: { id: 'c1', updates: {} } };
        storage.getQueue.mockResolvedValue([{ key: 1, val: operation }]);
        apiClient.updateCard.mockResolvedValue({});
        storage.removeFromQueue.mockResolvedValue();

        const { result } = renderHook(() => useOfflineSync());

        await act(async () => {
            await result.current.scheduleSync(operation);
        });

        expect(apiClient.updateCard).toHaveBeenCalledWith('c1', {});
        expect(storage.removeFromQueue).toHaveBeenCalledWith(1);
    });

    test('handles 409 conflicts and triggers onConflict', async () => {
        const onConflict = jest.fn();
        const serverItem = { id: '1', version: 2 };
        const operation = { type: 'UPDATE_CARD', payload: { id: '1', updates: { title: 'Mine' }, version: 1 } };

        storage.getQueue.mockResolvedValue([{ key: 1, val: operation }]);
        apiClient.updateCard.mockRejectedValue({ status: 409, serverItem });
        storage.removeFromQueue.mockResolvedValue();

        renderHook(() => useOfflineSync({ onConflict }));

        await act(async () => {
            window.dispatchEvent(new Event('online'));
        });

        expect(onConflict).toHaveBeenCalledWith(expect.objectContaining({
            id: 1,
            server: serverItem,
        }));
    });

    test('resolveConflict with "server" resolution', async () => {
        const operation = { type: 'UPDATE_CARD', payload: { id: '1' } };
        const serverItem = { id: '1', title: 'Server' };
        storage.getQueue.mockResolvedValue([{ key: 1, val: operation }]);
        storage.removeFromQueue.mockResolvedValue();
        storage.saveCard.mockResolvedValue();

        const { result } = renderHook(() => useOfflineSync());

        await act(async () => {
            await result.current.resolveConflict(1, 'server', serverItem);
        });

        expect(storage.saveCard).toHaveBeenCalledWith(serverItem);
        expect(storage.removeFromQueue).toHaveBeenCalledWith(1);
    });

    test('resolveConflict with "local" resolution updates version and re-adds to queue', async () => {
        const operation = { type: 'UPDATE_CARD', payload: { id: '1', updates: { title: 'Mine' } } };
        const serverItem = { id: '1', version: 10 };
        storage.getQueue.mockResolvedValue([{ key: 1, val: operation }]);
        storage.removeFromQueue.mockResolvedValue();
        storage.addToQueue.mockResolvedValue();

        const { result } = renderHook(() => useOfflineSync());

        await act(async () => {
            await result.current.resolveConflict(1, 'local', serverItem);
        });

        expect(storage.addToQueue).toHaveBeenCalledWith(expect.objectContaining({
            payload: expect.objectContaining({
                updates: expect.objectContaining({ version: 10 })
            })
        }));
    });

    test('processOperation stops on network error and retries later', async () => {
        storage.getQueue.mockResolvedValue([{ key: 1, val: { type: 'ADD_LIST', payload: {} } }]);
        apiClient.createList.mockRejectedValue({ message: 'NETWORK_ERROR', isOffline: true });

        const { result } = renderHook(() => useOfflineSync());

        await act(async () => {
            await result.current.scheduleSync({ type: 'ADD_LIST', payload: {} });
        });

        // Should not remove from queue
        expect(storage.removeFromQueue).not.toHaveBeenCalled();
    });

    test('handles multiple operations sequentially', async () => {
        storage.getQueue.mockResolvedValue([
            { key: 1, val: { type: 'ADD_LIST', payload: {} } },
            { key: 2, val: { type: 'ADD_CARD', payload: {} } },
        ]);
        apiClient.createList.mockResolvedValue({});
        apiClient.createCard.mockResolvedValue({});
        storage.removeFromQueue.mockResolvedValue();

        const { result } = renderHook(() => useOfflineSync());

        await act(async () => {
            await result.current.scheduleSync({ type: 'TEST', payload: {} });
        });

        expect(apiClient.createList).toHaveBeenCalled();
        expect(apiClient.createCard).toHaveBeenCalled();
        expect(storage.removeFromQueue).toHaveBeenCalledTimes(2);
    });
});
