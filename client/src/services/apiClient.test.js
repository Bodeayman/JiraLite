import { apiClient } from './apiClient';

/* global fetch */
global.fetch = jest.fn();

describe('apiClient', () => {
    beforeEach(() => {
        fetch.mockClear();
    });

    test('getBoard calls correct endpoint', async () => {
        fetch.mockResolvedValueOnce({
            ok: true,
            json: async () => ({ columns: [] }),
        });
        const res = await apiClient.getBoard();
        expect(fetch).toHaveBeenCalledWith(expect.stringContaining('/board'), expect.any(Object));
        expect(res).toEqual({ columns: [] });
    });

    test('createList calls POST with data', async () => {
        const list = { id: '1', title: 'Test' };
        fetch.mockResolvedValueOnce({
            ok: true,
            json: async () => list,
        });
        await apiClient.createList(list);
        expect(fetch).toHaveBeenCalledWith(
            expect.stringContaining('/lists'),
            expect.objectContaining({
                method: 'POST',
                body: JSON.stringify(list)
            })
        );
    });

    test('updateList calls PUT with data', async () => {
        const updates = { title: 'Updated' };
        fetch.mockResolvedValueOnce({
            ok: true,
            json: async () => ({ id: '1', ...updates }),
        });
        await apiClient.updateList('1', updates);
        expect(fetch).toHaveBeenCalledWith(
            expect.stringContaining('/lists/1'),
            expect.objectContaining({ method: 'PUT' })
        );
    });

    test('deleteList calls DELETE', async () => {
        fetch.mockResolvedValueOnce({
            ok: true,
            json: async () => ({ success: true }),
        });
        await apiClient.deleteList('1');
        expect(fetch).toHaveBeenCalledWith(
            expect.stringContaining('/lists/1'),
            expect.objectContaining({ method: 'DELETE' })
        );
    });

    test('createCard calls POST', async () => {
        const card = { id: 'c1', title: 'Card' };
        fetch.mockResolvedValueOnce({
            ok: true,
            json: async () => card,
        });
        await apiClient.createCard(card);
        expect(fetch).toHaveBeenCalledWith(expect.stringContaining('/cards'), expect.any(Object));
    });

    test('updateCard calls PUT', async () => {
        fetch.mockResolvedValueOnce({
            ok: true,
            json: async () => ({ id: 'c1' }),
        });
        await apiClient.updateCard('c1', { title: 'New' });
        expect(fetch).toHaveBeenCalledWith(expect.stringContaining('/cards/c1'), expect.any(Object));
    });

    test('deleteCard calls DELETE', async () => {
        fetch.mockResolvedValueOnce({
            ok: true,
            json: async () => ({ success: true }),
        });
        await apiClient.deleteCard('c1');
        expect(fetch).toHaveBeenCalledWith(expect.stringContaining('/cards/c1'), expect.any(Object));
    });

    test('reorder calls POST', async () => {
        fetch.mockResolvedValueOnce({
            ok: true,
            json: async () => ({ success: true }),
        });
        await apiClient.reorder({ cards: [] });
        expect(fetch).toHaveBeenCalledWith(expect.stringContaining('/reorder'), expect.any(Object));
    });

    test('handles network error', async () => {
        fetch.mockRejectedValue(new Error('Failed to fetch'));
        await expect(apiClient.getBoard()).rejects.toThrow('NETWORK_ERROR');
    });

    test('handles 409 conflict and extracts serverItem', async () => {
        const serverItem = { id: '1', version: 2 };
        fetch.mockResolvedValueOnce({
            ok: false,
            status: 409,
            json: async () => ({ serverItem })
        });

        try {
            await apiClient.updateCard('1', { version: 1 });
        } catch (error) {
            expect(error.status).toBe(409);
            expect(error.serverItem).toEqual(serverItem);
        }
    });
});
