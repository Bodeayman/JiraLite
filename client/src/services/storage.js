const DB_NAME = 'JiraLiteDB';
const DB_VERSION = 3;
const STORES = {
    LISTS: 'lists',
    CARDS: 'cards',
    TAGS: 'tags',
    QUEUE: 'queue'
};


const JSON_BACKUP_KEY = 'jiralite_board_backup';

const openDB = () => {
    return new Promise((resolve, reject) => {
        const request = indexedDB.open(DB_NAME, DB_VERSION);

        request.onerror = (event) => {
            console.error("IDB Open Error:", event.target.error);
            reject(event.target.error);
        };

        request.onblocked = (_event) => {
            console.warn("IDB Upgrade Blocked. Please close other tabs of this app.");
        };

        request.onupgradeneeded = (_event) => {
            const db = request.result;
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


const saveJSONBackup = (data) => {
    try {
        const jsonData = JSON.stringify(data);
        localStorage.setItem(JSON_BACKUP_KEY, jsonData);
    } catch (error) {
        console.error('Failed to save JSON backup:', error);
    }
};


const loadJSONBackup = () => {
    try {
        const jsonData = localStorage.getItem(JSON_BACKUP_KEY);
        if (jsonData) {
            const data = JSON.parse(jsonData);
            return data;
        }
    } catch (error) {
        console.error('Failed to load JSON backup:', error);
    }
    return null;
};


const buildBoardDataFromDB = async (db) => {
    const lists = await getAllFromStore(db, STORES.LISTS);
    const cards = await getAllFromStore(db, STORES.CARDS);

    lists.sort((a, b) => a.order - b.order);

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


const updateJSONBackup = async () => {
    try {
        const db = await openDB();
        const boardData = await buildBoardDataFromDB(db);
        saveJSONBackup(boardData);
    } catch (error) {
        console.error('Failed to update JSON backup:', error);
    }
};

export const loadBoard = async () => {
    try {
        const db = await openDB();
        const boardData = await buildBoardDataFromDB(db);


        if (boardData.columns.length === 0) {
            const backupData = loadJSONBackup();
            if (backupData && backupData.columns && backupData.columns.length > 0) {
                console.log('Restoring from JSON backup...');

                for (const column of backupData.columns) {
                    const { cards: columnCards, ...listData } = column;
                    const listTx = db.transaction(STORES.LISTS, 'readwrite');
                    listTx.objectStore(STORES.LISTS).put(listData);
                    await new Promise((resolve, reject) => {
                        listTx.oncomplete = () => resolve();
                        listTx.onerror = () => reject(listTx.error);
                    });

                    for (const card of columnCards) {
                        const cardTx = db.transaction(STORES.CARDS, 'readwrite');
                        cardTx.objectStore(STORES.CARDS).put(card);
                        await new Promise((resolve, reject) => {
                            cardTx.oncomplete = () => resolve();
                            cardTx.onerror = () => reject(cardTx.error);
                        });
                    }
                }

                return await buildBoardDataFromDB(await openDB());
            }
        }


        saveJSONBackup(boardData);

        return boardData;
    } catch (error) {
        console.error('Failed to load from IndexedDB, trying JSON backup:', error);

        const backupData = loadJSONBackup();
        if (backupData) {
            return backupData;
        }
        return { columns: [] };
    }
};

export const saveList = async (list) => {
    const db = await openDB();
    return new Promise((resolve, reject) => {
        const request = getStore(db, STORES.LISTS, 'readwrite').put(list);
        request.onsuccess = async () => {

            await updateJSONBackup();
            resolve(request.result);
        };
        request.onerror = () => reject(request.error);
    });
};

export const saveCard = async (card) => {
    const db = await openDB();
    return new Promise((resolve, reject) => {
        const request = getStore(db, STORES.CARDS, 'readwrite').put(card);
        request.onsuccess = async () => {

            await updateJSONBackup();
            resolve(request.result);
        };
        request.onerror = () => reject(request.error);
    });
};

export const deleteCard = async (id) => {
    const db = await openDB();
    return new Promise((resolve, reject) => {
        const request = getStore(db, STORES.CARDS, 'readwrite').delete(id);
        request.onsuccess = async () => {

            await updateJSONBackup();
            resolve(request.result);
        };
        request.onerror = () => reject(request.error);
    });
};

export const deleteList = async (id) => {
    const db = await openDB();
    return new Promise((resolve, reject) => {
        const request = getStore(db, STORES.LISTS, 'readwrite').delete(id);
        request.onsuccess = async () => {

            await updateJSONBackup();
            resolve(request.result);
        };
        request.onerror = () => reject(request.error);
    });
};


export const updateListsOrder = async (lists) => {
    const db = await openDB();
    const tx = db.transaction(STORES.LISTS, 'readwrite');
    lists.forEach(list => {
        tx.objectStore(STORES.LISTS).put(list);
    });
    return new Promise((resolve, reject) => {
        tx.oncomplete = async () => {

            const boardData = await loadBoard();
            saveJSONBackup(boardData);
            resolve();
        };
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
        tx.oncomplete = async () => {

            const boardData = await loadBoard();
            saveJSONBackup(boardData);
            resolve();
        };
        tx.onerror = () => reject(tx.error);
    });
};



export const addToQueue = async (action) => {
    const db = await openDB();
    return new Promise((resolve, reject) => {

        const item = { ...action, timestamp: Date.now() };
        const request = getStore(db, STORES.QUEUE, 'readwrite').add(item);
        request.onsuccess = () => resolve(request.result);
        request.onerror = () => reject(request.error);
    });
}


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


export const exportBoardAsJSON = async () => {
    const boardData = await loadBoard();
    return JSON.stringify(boardData, null, 2);
};


export const importBoardFromJSON = async (jsonString) => {
    try {
        const boardData = JSON.parse(jsonString);
        if (!boardData || !boardData.columns || !Array.isArray(boardData.columns)) {
            throw new Error('Invalid board data format');
        }


        const db = await openDB();


        const listsTx = db.transaction(STORES.LISTS, 'readwrite');
        await new Promise((resolve, reject) => {
            listsTx.objectStore(STORES.LISTS).clear();
            listsTx.oncomplete = () => resolve();
            listsTx.onerror = () => reject(listsTx.error);
        });


        const cardsTx = db.transaction(STORES.CARDS, 'readwrite');
        await new Promise((resolve, reject) => {
            cardsTx.objectStore(STORES.CARDS).clear();
            cardsTx.oncomplete = () => resolve();
            cardsTx.onerror = () => reject(cardsTx.error);
        });


        for (const column of boardData.columns) {
            const { cards: columnCards, ...listData } = column;
            await saveList(listData);
            for (const card of columnCards) {
                await saveCard(card);
            }
        }


        saveJSONBackup(boardData);

        return boardData;
    } catch (error) {
        console.error('Failed to import board from JSON:', error);
        throw error;
    }
};


export const downloadBoardAsJSON = async () => {
    const jsonString = await exportBoardAsJSON();
    const blob = new Blob([jsonString], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `jiralite-board-${new Date().toISOString().split('T')[0]}.json`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
};
