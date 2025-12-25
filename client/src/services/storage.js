const DB_NAME = 'JiraLiteDB';
const DB_VERSION = 3; // Incremented to 3 to force 'queue' creation if missed
const STORES = {
    LISTS: 'lists',
    CARDS: 'cards',
    TAGS: 'tags',
    QUEUE: 'queue'
};

const openDB = () => {
    return new Promise((resolve, reject) => {
        const request = indexedDB.open(DB_NAME, DB_VERSION);

        request.onerror = (event) => {
            console.error("IDB Open Error:", event.target.error);
            reject(event.target.error);
        };

        request.onblocked = (event) => {
            console.warn("IDB Upgrade Blocked. Please close other tabs of this app.");
        };

        request.onupgradeneeded = (event) => {
            console.log("IDB Upgrading from ", event.oldVersion, "to", event.newVersion);
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
            if (!db.objectStoreNames.contains(STORES.QUEUE)) {
                console.log("Creating QUEUE store");
                db.createObjectStore(STORES.QUEUE, { autoIncrement: true });
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
            .map(card => ({ ...card, tags: card.tags || [] }));

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

// --- Queue Methods ---

export const addToQueue = async (action) => {
    const db = await openDB();
    return new Promise((resolve, reject) => {
        // Add timestamp for debugging/sorting if needed, though autoIncrement handles order
        const item = { ...action, timestamp: Date.now() };
        const request = getStore(db, STORES.QUEUE, 'readwrite').add(item);
        request.onsuccess = () => resolve(request.result); // Returns key
        request.onerror = () => reject(request.error);
    });
}

// Get all items in queue, with their keys
export const getQueue = async () => {
    const db = await openDB();
    return new Promise((resolve, reject) => {
        const store = getStore(db, STORES.QUEUE);
        const request = store.openCursor();
        const items = [];
        request.onsuccess = (event) => {
            const cursor = event.target.result;
            if (cursor) {
                items.push({ key: cursor.key, val: cursor.value });
                cursor.continue();
            } else {
                resolve(items);
            }
        };
        request.onerror = () => reject(request.error);
    });
};

// Remove an item by key (used after successful sync)
export const removeFromQueue = async (key) => {
    const db = await openDB();
    return new Promise((resolve, reject) => {
        const request = getStore(db, STORES.QUEUE, 'readwrite').delete(key);
        request.onsuccess = () => resolve();
        request.onerror = () => reject(request.error);
    });
};

export const clearQueue = async () => {
    const db = await openDB();
    return new Promise((resolve, reject) => {
        const request = getStore(db, STORES.QUEUE, 'readwrite').clear();
        request.onsuccess = () => resolve();
        request.onerror = () => reject(request.error);
    });
};
