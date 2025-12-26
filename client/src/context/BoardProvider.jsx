import { createContext, useContext, useReducer, useEffect, useState, useCallback, useRef } from 'react';
import { boardReducer, initialState } from './boardReducer';
import { loadBoard, saveList, saveCard, deleteCard, deleteList, updateListsOrder, updateCardsOrder } from '../services/storage';
import { useOfflineSync } from '../hooks/useOfflineSync';
import { apiClient } from '../services/apiClient';
import { v4 as uuidv4 } from 'uuid';

const BoardContext = createContext();

export const BoardProvider = ({ children }) => {
    const [state, dispatch] = useReducer(boardReducer, initialState);
    const [conflicts, setConflicts] = useState([]);
    const [syncErrors, setSyncErrors] = useState([]);
    const previousStateRef = useRef(null);

    const refreshBoard = useCallback(async () => {
        try {
            const serverData = await apiClient.getBoard();
            // Only update if server has actual data (non-empty)
            // Never overwrite local data with empty server data
            if (serverData && serverData.columns && Array.isArray(serverData.columns) && serverData.columns.length > 0) {
                // Server has data - merge with local (server wins for conflicts)
                const currentLocalData = await loadBoard();

                // If local has data and server has data, merge them intelligently
                if (currentLocalData.columns.length > 0) {
                    // Merge: keep local items that don't exist on server, update items that exist on both
                    const mergedColumns = [...currentLocalData.columns];

                    // Update existing columns from server
                    serverData.columns.forEach(serverCol => {
                        const localIndex = mergedColumns.findIndex(col => col.id === serverCol.id);
                        if (localIndex >= 0) {
                            // Merge cards: keep local cards not on server, update cards that exist on both
                            const localCol = mergedColumns[localIndex];
                            const mergedCards = [...localCol.cards];

                            // Update existing cards from server
                            serverCol.cards.forEach(serverCard => {
                                const localCardIndex = mergedCards.findIndex(card => card.id === serverCard.id);
                                if (localCardIndex >= 0) {
                                    // Server version wins for existing cards
                                    mergedCards[localCardIndex] = serverCard;
                                } else {
                                    // Add new cards from server
                                    mergedCards.push(serverCard);
                                }
                            });

                            // Update column with merged cards
                            mergedColumns[localIndex] = {
                                ...serverCol,
                                cards: mergedCards.sort((a, b) => (a.order_id || 0) - (b.order_id || 0))
                            };
                        } else {
                            // Add new columns from server
                            mergedColumns.push(serverCol);
                        }
                    });

                    // Sort by order
                    mergedColumns.sort((a, b) => (a.order || 0) - (b.order || 0));

                    dispatch({ type: 'INIT_BOARD', payload: { columns: mergedColumns } });

                    // Save merged data to local storage
                    for (const column of mergedColumns) {
                        const { cards, ...listData } = column;
                        await saveList(listData);
                        for (const card of cards) {
                            await saveCard(card);
                        }
                    }
                } else {
                    // Local is empty, use server data
                    dispatch({ type: 'INIT_BOARD', payload: serverData });

                    // Save server data to local storage
                    for (const column of serverData.columns) {
                        const { cards, ...listData } = column;
                        await saveList(listData);
                        for (const card of cards) {
                            await saveCard(card);
                        }
                    }
                }
            } else {
                // Server returned empty data - keep local data, don't overwrite
                if (typeof process !== 'undefined' && process.env?.NODE_ENV === 'development') {
                    console.log("Server returned empty data, preserving local data");
                }
            }
        } catch (e) {
            // Silently fail - app works completely offline with local data
            // Only log in development mode
            if (typeof process !== 'undefined' && process.env?.NODE_ENV === 'development') {
                console.log("Server unavailable, using local data (offline mode)");
            }
        }
    }, []);

    const { scheduleSync, isOnline, isSyncing, resolveConflict: syncResolve } = useOfflineSync({
        onSyncError: (error, operation) => {
            // Network errors are handled silently (offline mode)
            if (error.message === 'NETWORK_ERROR' || error.isOffline) {
                return;
            }

            // For non-network errors, revert optimistic update and show error
            if (previousStateRef.current) {
                dispatch({
                    type: 'REVERT_OPTIMISTIC_UPDATE',
                    payload: { previousState: previousStateRef.current }
                });
                previousStateRef.current = null;
            }

            // Show error to user
            const errorMessage = error.message || 'Failed to sync changes';
            setSyncErrors(prev => [...prev, {
                id: Date.now(),
                message: errorMessage,
                operation: operation.type,
                timestamp: Date.now()
            }]);

            // Auto-dismiss error after 5 seconds
            setTimeout(() => {
                setSyncErrors(prev => prev.slice(1));
            }, 5000);

            // Try to refresh if server error (not network)
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
                // Always load from local storage first (works offline)
                const data = await loadBoard();
                if (data.columns.length > 0) {
                    dispatch({ type: 'INIT_BOARD', payload: data });
                }

                // Only try to refresh from server if we have no local data
                // This prevents overwriting local data with empty server responses
                if (navigator.onLine && data.columns.length === 0) {
                    refreshBoard().catch(() => {
                        // Silently fail - app works offline with local data
                    });
                }
            } catch (error) {
                console.error("Failed to load board", error);
            }
        };
        load();
    }, []);


    const customDispatch = async (action) => {
        let finalAction = action;

        // Store previous state for optimistic update revert
        previousStateRef.current = JSON.parse(JSON.stringify(state));

        if (action.type === 'ADD_LIST') {
            const listId = uuidv4();
            const newList = {
                id: listId,
                title: action.payload,
                archived: false,
                order: state.columns.length,
                last_modified: Date.now(),
                version: 1,
                lastModifiedAt: Date.now(),
                cards: []
            };
            finalAction = { ...action, payload: { id: listId, title: action.payload, version: 1 } };

            // Optimistic UI update
            dispatch(finalAction);

            try {
                await saveList(newList);
                // Store base version for three-way merge
                scheduleSync({
                    type: 'ADD_LIST',
                    payload: newList,
                    baseVersion: null // New item, no base
                });
                previousStateRef.current = null; // Clear on success
            } catch (e) {
                console.error("Failed to save list", e);
                // Revert on local save failure
                if (previousStateRef.current) {
                    dispatch({
                        type: 'REVERT_OPTIMISTIC_UPDATE',
                        payload: { previousState: previousStateRef.current }
                    });
                    previousStateRef.current = null;
                }
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
                version: 1,
                lastModifiedAt: Date.now(),
                tags: []
            };
            finalAction = { ...action, payload: { ...action.payload, id: cardId, version: 1 } };

            // Optimistic UI update
            dispatch(finalAction);

            try {
                await saveCard(newCard);
                scheduleSync({
                    type: 'ADD_CARD',
                    payload: newCard,
                    baseVersion: null
                });
                previousStateRef.current = null;
            } catch (e) {
                console.error("Failed to save card", e);
                if (previousStateRef.current) {
                    dispatch({
                        type: 'REVERT_OPTIMISTIC_UPDATE',
                        payload: { previousState: previousStateRef.current }
                    });
                    previousStateRef.current = null;
                }
            }
            return;
        }

        // For operations that are already dispatched, we need to track state before dispatch
        // But since dispatch happens first, we track it before the switch
        if (['MOVE_LIST', 'MOVE_CARD'].includes(action.type)) {
            previousStateRef.current = JSON.parse(JSON.stringify(state));
        }

        dispatch(action);

        try {
            switch (action.type) {
                case 'DELETE_CARD': {
                    // Store card before deletion for revert
                    const cardToDelete = state.columns
                        .flatMap(col => col.cards)
                        .find(c => c.id === action.payload);
                    const baseCard = cardToDelete ? { ...cardToDelete } : null;

                    // Optimistic UI update
                    dispatch(action);

                    try {
                        await deleteCard(action.payload);
                        scheduleSync({
                            type: 'DELETE_CARD',
                            payload: action.payload,
                            baseVersion: baseCard
                        });
                        previousStateRef.current = null;
                    } catch (e) {
                        console.error("Failed to delete card", e);
                        if (previousStateRef.current) {
                            dispatch({
                                type: 'REVERT_OPTIMISTIC_UPDATE',
                                payload: { previousState: previousStateRef.current }
                            });
                            previousStateRef.current = null;
                        }
                    }
                    break;
                }
                case 'UPDATE_CARD': {
                    const col = state.columns.find(c => c.cards.some(card => card.id === action.payload.id));
                    const card = col?.cards.find(c => c.id === action.payload.id);
                    if (card) {
                        // Store base version for three-way merge
                        const baseVersion = { ...card };
                        const updatedCard = {
                            ...card,
                            ...action.payload.updates,
                            last_modified: Date.now(),
                            lastModifiedAt: Date.now(),
                            version: (card.version || 1) + 1
                        };

                        // Optimistic UI update with version
                        dispatch({
                            type: 'UPDATE_CARD',
                            payload: {
                                id: action.payload.id,
                                updates: {
                                    ...action.payload.updates,
                                    version: updatedCard.version
                                }
                            }
                        });

                        await saveCard(updatedCard);
                        scheduleSync({
                            type: 'UPDATE_CARD',
                            payload: {
                                id: action.payload.id,
                                updates: { ...action.payload.updates, version: card.version }
                            },
                            baseVersion: baseVersion // Store base for three-way merge
                        });
                        previousStateRef.current = null;
                    }
                    break;
                }

                case 'EDIT_LIST_TITLE': {
                    const list = state.columns.find(c => c.id === action.payload.id);
                    if (list) {
                        const baseVersion = { ...list };
                        const updatedList = {
                            ...list,
                            title: action.payload.title,
                            last_modified: Date.now(),
                            lastModifiedAt: Date.now(),
                            version: (list.version || 1) + 1
                        };

                        // Optimistic UI update
                        dispatch({
                            type: 'EDIT_LIST_TITLE',
                            payload: {
                                id: action.payload.id,
                                title: action.payload.title,
                                version: updatedList.version
                            }
                        });

                        await saveList(updatedList);
                        scheduleSync({
                            type: 'EDIT_LIST_TITLE',
                            payload: {
                                id: action.payload.id,
                                title: action.payload.title,
                                version: list.version
                            },
                            baseVersion: baseVersion
                        });
                        previousStateRef.current = null;
                    }
                    break;
                }

                case 'ARCHIVE_LIST': {
                    // Store list before deletion for revert
                    const listToArchive = state.columns.find(col => col.id === action.payload);
                    const baseList = listToArchive ? { ...listToArchive } : null;

                    // Optimistic UI update
                    dispatch(action);

                    try {
                        await deleteList(action.payload);
                        scheduleSync({
                            type: 'ARCHIVE_LIST',
                            payload: action.payload,
                            baseVersion: baseList
                        });
                        previousStateRef.current = null;
                    } catch (e) {
                        console.error("Failed to archive list", e);
                        if (previousStateRef.current) {
                            dispatch({
                                type: 'REVERT_OPTIMISTIC_UPDATE',
                                payload: { previousState: previousStateRef.current }
                            });
                            previousStateRef.current = null;
                        }
                    }
                    break;
                }

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
                        scheduleSync({
                            type: 'MOVE_LIST',
                            payload: { lists: updates.map(l => ({ id: l.id, order: l.order })) },
                            baseVersion: state.columns // Store previous column order
                        });
                        previousStateRef.current = null;
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

                            // Store base state for three-way merge
                            const baseCards = {
                                source: [...sourceCol.cards],
                                dest: sourceCol.id === destCol.id ? [] : [...destCol.cards]
                            };

                            scheduleSync({
                                type: 'MOVE_CARD',
                                payload: { cards: cardsToUpdate.map(c => ({ id: c.id, order_id: c.order_id, list_id: c.list_id })) },
                                baseVersion: baseCards
                            });
                            previousStateRef.current = null;
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

    const dismissError = useCallback((errorId) => {
        setSyncErrors(prev => prev.filter(err => err.id !== errorId));
    }, []);

    return (
        <BoardContext.Provider value={{
            state,
            dispatch: customDispatch,
            persistListOrder,
            persistCardOrder,
            isOnline,
            isSyncing,
            refreshBoard,
            conflicts,
            resolveConflict,
            syncErrors,
            dismissError
        }}>
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
