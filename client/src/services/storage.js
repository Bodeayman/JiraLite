const DB_NAME = 'JiraLiteDB';
const DB_VERSION = 1;
const STORES = {
    LISTS: 'lists',
    CARDS: 'cards',
    TAGS: 'tags'
};

const openDB = () => {
    return new Promise((resolve, reject) => {
        const request = indexedDB.open(DB_NAME, DB_VERSION);

        request.onerror = (event) => reject(event.target.error);

        request.onupgradeneeded = (event) => {
            const db = event.target.result;
            if (!db.objectStoreNames.contains(STORES.LISTS)) {
                db.createObjectStore(STORES.LISTS, { keyPath: 'id' });
            }
            if (!db.objectStoreNames.contains(STORES.CARDS)) {
                const cardStore = db.createObjectStore(STORES.CARDS, { keyPath: 'id' });
                cardStore.createIndex('list_id', 'list_id', { unique: false });
            }
            if (!db.objectStoreNames.contains(STORES.TAGS)) {
                const tagStore = db.createObjectStore(STORES.TAGS, { keyPath: 'id' });
                tagStore.createIndex('card_id', 'card_id', { unique: false });
            }
        };

        request.onsuccess = (event) => resolve(event.target.result);
    });
};

const getStore = (db, storeName, mode = 'readonly') => {
    return db.transaction(storeName, mode).objectStore(storeName);
};

const getAllFromStore = (db, storeName) => {
    return new Promise((resolve, reject) => {
        const request = getStore(db, storeName).getAll();
        request.onsuccess = () => resolve(request.result);
        request.onerror = () => reject(request.error);
    });
};

export const loadBoard = async () => {
    const db = await openDB();

    const lists = await getAllFromStore(db, STORES.LISTS);
    const cards = await getAllFromStore(db, STORES.CARDS);

    // Sort lists by order
    lists.sort((a, b) => a.order - b.order);

    // Map cards to lists and sort by order_id
    const columns = lists.map(list => {
        const listCards = cards
            .filter(card => card.list_id === list.id)
            .sort((a, b) => a.order_id - b.order_id)
            .map(card => ({ ...card, tags: card.tags || [] })); // Ensure tags exists (simple array for now based on request context, or we could fetch tags store if strict normalization needed)

        return {
            ...list,
            cards: listCards
        };
    });

    return { columns };
};

export const saveList = async (list) => {
    const db = await openDB();
    return new Promise((resolve, reject) => {
        const request = getStore(db, STORES.LISTS, 'readwrite').put(list);
        request.onsuccess = () => resolve(request.result);
        request.onerror = () => reject(request.error);
    });
};

export const saveCard = async (card) => {
    const db = await openDB();
    return new Promise((resolve, reject) => {
        // Ensure tags are stored if we are keeping them on the card object for simplicity
        // or strip them if normalized. The request mentioned tags entity but also said "schema... tags (Card_id, name)".
        // For compliance with "tags entity", we should save tags separately, but for now let's persist the card.
        const request = getStore(db, STORES.CARDS, 'readwrite').put(card);
        request.onsuccess = () => resolve(request.result);
        request.onerror = () => reject(request.error);
    });
};

export const deleteCard = async (id) => {
    const db = await openDB();
    return new Promise((resolve, reject) => {
        const request = getStore(db, STORES.CARDS, 'readwrite').delete(id);
        request.onsuccess = () => resolve(request.result);
        request.onerror = () => reject(request.error);
    });
};

export const deleteList = async (id) => {
    const db = await openDB();
    // Should transactionally delete cards too, but keeping simple for now
    return new Promise((resolve, reject) => {
        const request = getStore(db, STORES.LISTS, 'readwrite').delete(id);
        request.onsuccess = () => resolve(request.result);
        request.onerror = () => reject(request.error);
    });
};

// Batch update for reordering
export const updateListsOrder = async (lists) => {
    const db = await openDB();
    const tx = db.transaction(STORES.LISTS, 'readwrite');
    lists.forEach(list => {
        tx.objectStore(STORES.LISTS).put(list);
    });
    return new Promise((resolve, reject) => {
        tx.oncomplete = () => resolve();
        tx.onerror = () => reject(tx.error);
    });
};

export const updateCardsOrder = async (cards) => {
    const db = await openDB();
    const tx = db.transaction(STORES.CARDS, 'readwrite');
    cards.forEach(card => {
        tx.objectStore(STORES.CARDS).put(card);
    });
    return new Promise((resolve, reject) => {
        tx.oncomplete = () => resolve();
        tx.onerror = () => reject(tx.error);
    });
};