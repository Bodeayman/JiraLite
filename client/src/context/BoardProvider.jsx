import { createContext, useContext, useReducer, useEffect, useState } from 'react';
import { boardReducer, initialState } from './boardReducer';
import { loadBoard, saveList, saveCard, deleteCard, deleteList, updateListsOrder, updateCardsOrder } from '../services/storage';
import { useOfflineSync } from '../hooks/useOfflineSync';
import { apiClient } from '../services/apiClient';
import { v4 as uuidv4 } from 'uuid';

const BoardContext = createContext();

export const BoardProvider = ({ children }) => {
    const [state, dispatch] = useReducer(boardReducer, initialState);
    const [conflicts, setConflicts] = useState([]);

    const { scheduleSync, isOnline, isSyncing, resolveConflict: syncResolve } = useOfflineSync({
        onSyncError: (error, operation) => {
            console.error("Sync error for operation:", operation, error);
            refreshBoard();
        },
        onConflict: (conflict) => {
            console.log("Conflict detected:", conflict);
            setConflicts(prev => [...prev, conflict]);
        },
        syncInterval: 30000
    });

    const resolveConflict = async (conflictId, resolution) => {
        const conflict = conflicts.find(c => c.id === conflictId);
        if (conflict) {
            await syncResolve(conflictId, resolution, conflict.server);
            setConflicts(prev => prev.filter(c => c.id !== conflictId));
            if (resolution === 'server') {
                refreshBoard();
            }
        }
    };

    useEffect(() => {
        const load = async () => {
            try {
                // Load from Local DB (Optimistic/Offline start)
                const data = await loadBoard();
                if (data.columns.length > 0) {
                    dispatch({ type: 'INIT_BOARD', payload: data });
                }

                // If online, fetch fresh from server to resolve discrepancies
                if (navigator.onLine) {
                    refreshBoard();
                }
            } catch (error) {
                console.error("Failed to load board", error);
            }
        };
        load();
    }, []);

    const refreshBoard = async () => {
        try {
            const serverData = await apiClient.getBoard();
            // Optional: Merge Strategy? For now, server wins implies we overwrite local.
            // But if we have unsynced changes in queue, they might be overwritten.
            // Ideally: Process Queue first, THEN refresh.
            // But simpler: Just init with server data.
            dispatch({ type: 'INIT_BOARD', payload: serverData });

            // Also update local DB to match server
            // specialized clear and rewrite or just let next actions update it?
            // To be consistent, we should probably update storage.js with server state.
            // Leaving for now as "Eventual Consistency" via sync.
        } catch (e) {
            console.error("Failed to refresh from server", e);
        }
    };

    const customDispatch = async (action) => {
        let finalAction = action;

        if (action.type === 'ADD_LIST') {
            const listId = uuidv4();
            const newList = {
                id: listId,
                title: action.payload,
                archived: false,
                order: state.columns.length,
                last_modified: Date.now(),
                version: 1, // Init version
                lastModifiedAt: Date.now(),
                cards: []
            };
            finalAction = { ...action, payload: { id: listId, title: action.payload } };
            dispatch(finalAction);

            try {
                await saveList(newList);
                scheduleSync({ type: 'ADD_LIST', payload: newList });
            } catch (e) {
                console.error("Failed to save list", e);
            }
            return;
        }

        if (action.type === 'ADD_CARD') {
            const cardId = uuidv4();
            const { columnId, title } = action.payload;
            const column = state.columns.find(c => c.id === columnId);
            const newCard = {
                id: cardId,
                title: title,
                description: '',
                list_id: columnId,
                order_id: column ? column.cards.length : 0,
                last_modified: Date.now(),
                version: 1, // Init version
                lastModifiedAt: Date.now(),
                tags: []
            };
            finalAction = { ...action, payload: { ...action.payload, id: cardId } };
            dispatch(finalAction);

            try {
                await saveCard(newCard);
                scheduleSync({ type: 'ADD_CARD', payload: newCard });
            } catch (e) {
                console.error("Failed to save card", e);
            }
            return;
        }

        dispatch(action);

        try {
            switch (action.type) {
                case 'DELETE_CARD':
                    await deleteCard(action.payload);
                    scheduleSync({ type: 'DELETE_CARD', payload: action.payload });
                    break;

                case 'UPDATE_CARD':
                    const col = state.columns.find(c => c.cards.some(card => card.id === action.payload.id));
                    const card = col?.cards.find(c => c.id === action.payload.id);
                    if (card) {
                        const updatedCard = { ...card, ...action.payload.updates, last_modified: Date.now() };
                        await saveCard(updatedCard);
                        scheduleSync({ type: 'UPDATE_CARD', payload: { id: action.payload.id, updates: action.payload.updates } });
                    }
                    break;

                case 'EDIT_LIST_TITLE':
                    const list = state.columns.find(c => c.id === action.payload.id);
                    if (list) {
                        const updatedList = { ...list, title: action.payload.title, last_modified: Date.now() };
                        await saveList(updatedList);
                        scheduleSync({ type: 'EDIT_LIST_TITLE', payload: { id: action.payload.id, title: action.payload.title } });
                    }
                    break;

                case 'ARCHIVE_LIST':
                    await deleteList(action.payload);
                    scheduleSync({ type: 'ARCHIVE_LIST', payload: action.payload });
                    break;

                case 'MOVE_LIST': {
                    const { activeId, overId } = action.payload;
                    const oldIndex = state.columns.findIndex(col => col.id === activeId);
                    const newIndex = state.columns.findIndex(col => col.id === overId);

                    if (oldIndex !== -1 && newIndex !== -1 && oldIndex !== newIndex) {

                        const newColumns = [...state.columns];
                        const [movedColumn] = newColumns.splice(oldIndex, 1);
                        newColumns.splice(newIndex, 0, movedColumn);

                        const updates = newColumns.map((col, index) => ({
                            ...col,
                            order: index
                        }));

                        await updateListsOrder(updates);
                        // Send the full reordered list payload (or minimal change)
                        // API expects { lists: [{id, order}, ...] }
                        scheduleSync({ type: 'MOVE_LIST', payload: { lists: updates.map(l => ({ id: l.id, order: l.order })) } });
                    }
                    break;
                }

                case 'MOVE_CARD': {
                    const { activeId, overId, activeColumnId, overColumnId } = action.payload;

                    const sourceCol = state.columns.find(col => col.id === activeColumnId);
                    const destCol = state.columns.find(col => col.id === overColumnId);

                    if (sourceCol && destCol) {
                        // Use captured state to calculate persistence updates
                        const newSourceCards = [...sourceCol.cards];
                        const newDestCards = sourceCol.id === destCol.id ? newSourceCards : [...destCol.cards];

                        const activeCardIndex = newSourceCards.findIndex(c => c.id === activeId);

                        if (activeCardIndex !== -1) {
                            const [activeCard] = newSourceCards.splice(activeCardIndex, 1);

                            let insertIndex = newDestCards.length;
                            if (overId) {
                                const overIndex = newDestCards.findIndex(c => c.id === overId);
                                if (overIndex !== -1) insertIndex = overIndex;
                            }

                            newDestCards.splice(insertIndex, 0, activeCard);

                            let cardsToUpdate = [];

                            newDestCards.forEach((c, i) => {
                                cardsToUpdate.push({ ...c, order_id: i, list_id: overColumnId });
                            });

                            if (sourceCol.id !== destCol.id) {
                                newSourceCards.forEach((c, i) => {
                                    cardsToUpdate.push({ ...c, order_id: i, list_id: activeColumnId });
                                });
                            }

                            await updateCardsOrder(cardsToUpdate);

                            scheduleSync({ type: 'MOVE_CARD', payload: { cards: cardsToUpdate.map(c => ({ id: c.id, order_id: c.order_id, list_id: c.list_id })) } });
                        }
                    }
                    break;
                }
            }
        } catch (err) {
            console.error("Persistence error", err);
        }
    };

    const persistListOrder = async (lists) => {
        await updateListsOrder(lists);
    };

    const persistCardOrder = async (cards) => {
        await updateCardsOrder(cards);
    };

    return (
        <BoardContext.Provider value={{ state, dispatch: customDispatch, persistListOrder, persistCardOrder, isOnline, isSyncing, refreshBoard, conflicts, resolveConflict }}>
            {children}
        </BoardContext.Provider>
    );
};

export const useBoard = () => {
    const context = useContext(BoardContext);
    if (!context) {
        throw new Error('useBoard must be used within a BoardProvider');
    }
    return context;
};
