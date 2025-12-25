const BASE_URL = 'http://localhost:3001/api';

const request = async (endpoint, options = {}) => {
    const url = `${BASE_URL}${endpoint}`;
    const headers = { 'Content-Type': 'application/json', ...options.headers };

    try {
        const response = await fetch(url, { ...options, headers });
        if (!response.ok) {
            throw new Error(`API Error ${response.status}: ${response.statusText}`);
        }
        return await response.json();
    } catch (error) {
        // Distinguish between network error (offline) and server error (500/400)
        // 'Failed to fetch' usually means network error or server down
        if (error.message.includes('Failed to fetch')) {
            throw new Error('NETWORK_ERROR');
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
