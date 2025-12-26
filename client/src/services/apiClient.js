const BASE_URL = 'http://localhost:3001/api';

const request = async (endpoint, options = {}) => {
    const url = `${BASE_URL}${endpoint}`;
    const headers = { 'Content-Type': 'application/json', ...options.headers };

    // Create abort controller for timeout
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 5000);

    try {
        const response = await fetch(url, {
            ...options,
            headers,
            signal: controller.signal
        });
        clearTimeout(timeoutId);

        if (!response.ok) {
            const error = new Error(`API Error ${response.status}`);
            error.status = response.status;
            try {
                const data = await response.json();
                error.serverItem = data.serverItem || data;
            } catch (_e) {
                // Ignore JSON parse errors
            }
            throw error;
        }
        return await response.json();
    } catch (error) {
        clearTimeout(timeoutId);
        // Handle network errors silently - app works offline
        if (error.name === 'AbortError' || error.message.includes('Failed to fetch') || error.message === 'NETWORK_ERROR') {
            const networkError = new Error('NETWORK_ERROR');
            networkError.isOffline = true;
            throw networkError;
        }
        throw error;
    }
};

export const apiClient = {
    getBoard: () => request('/board'),

    // Lists
    createList: (list) => request('/lists', { method: 'POST', body: JSON.stringify(list) }),
    updateList: (id, updates) => request(`/lists/${id}`, { method: 'PUT', body: JSON.stringify(updates) }),
    deleteList: (id) => request(`/lists/${id}`, { method: 'DELETE' }),

    // Cards
    createCard: (card) => request('/cards', { method: 'POST', body: JSON.stringify(card) }),
    updateCard: (id, updates) => request(`/cards/${id}`, { method: 'PUT', body: JSON.stringify(updates) }),
    deleteCard: (id) => request(`/cards/${id}`, { method: 'DELETE' }),

    // Reorder
    reorder: (payload) => request('/reorder', { method: 'POST', body: JSON.stringify(payload) })
};
