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
            result.current.scheduleSync({ type: 'ADD_LIST', payload: {} });
        });

        expect(storage.addToQueue).toHaveBeenCalled();
        expect(apiClient.createList).toHaveBeenCalled();
        expect(storage.removeFromQueue).toHaveBeenCalledWith(1);
    });

    test('processes UPDATE_CARD operation', async () => {
        storage.getQueue.mockResolvedValue([{ key: 1, val: { type: 'UPDATE_CARD', payload: { id: 'c1', updates: {} } } }]);
        apiClient.updateCard.mockResolvedValue({});

        const { result } = renderHook(() => useOfflineSync());

        await act(async () => {
            // Trigger internal processQueue via effect or re-render? 
            // Better to trigger scheduleSync which calls processQueue
            storage.addToQueue.mockResolvedValue(2);
            result.current.scheduleSync({ type: 'TEST' });
        });

        expect(apiClient.updateCard).toHaveBeenCalled();
    });

    test('handles conflicts (409) and calls onConflict', async () => {
        const onConflict = jest.fn();
        const serverItem = { id: '1', version: 2 };
        const operation = { type: 'UPDATE_CARD', payload: { id: '1', updates: { title: 'Mine' }, version: 1 } };

        storage.getQueue.mockResolvedValue([{ key: 1, val: operation }]);
        apiClient.updateCard.mockRejectedValue({ status: 409, serverItem });

        renderHook(() => useOfflineSync({ onConflict }));

        await act(async () => {
            // Wait for interval or trigger
            window.dispatchEvent(new Event('online'));
        });

        expect(onConflict).toHaveBeenCalledWith(expect.objectContaining({
            id: 1,
            server: serverItem
        }));
    });

    test('resolveConflict with "server" resolution', async () => {
        const operation = { type: 'UPDATE_CARD', payload: { id: '1' } };
        const serverItem = { id: '1', title: 'Server' };
        storage.getQueue.mockResolvedValue([{ key: 1, val: operation }]);

        const { result } = renderHook(() => useOfflineSync());

        await act(async () => {
            await result.current.resolveConflict(1, 'server', serverItem);
        });

        expect(storage.saveCard).toHaveBeenCalledWith(serverItem);
        expect(storage.removeFromQueue).toHaveBeenCalledWith(1);
    });

    test('resolveConflict with "local" resolution', async () => {
        const operation = { type: 'UPDATE_CARD', payload: { id: '1', updates: { title: 'Mine' } } };
        const serverItem = { id: '1', version: 10 };
        storage.getQueue.mockResolvedValue([{ key: 1, val: operation }]);

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
});
