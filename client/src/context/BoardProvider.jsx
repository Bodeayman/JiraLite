import { createContext, useContext, useReducer, useEffect, useState, useCallback, useRef } from 'react';
import { boardReducer, initialState } from './boardReducer';
import {
    loadBoard, saveList, saveCard, deleteCard, deleteList,
    updateListsOrder, updateCardsOrder
} from '../services/storage';
import { useOfflineSync } from '../hooks/useOfflineSync';
import { apiClient } from '../services/apiClient';
import { v4 as uuidv4 } from 'uuid';
import { useUndoRedo } from '../hooks/useUndoRedo';

const BoardContext = createContext();

export const BoardProvider = ({ children }) => {
    const [state, dispatch] = useReducer(boardReducer, initialState);
    const [conflicts, setConflicts] = useState([]);
    const [syncErrors, setSyncErrors] = useState([]);
    const previousStateRef = useRef(null);
    const isRestoringRef = useRef(false);

    const {
        currentState: undoRedoState,
        setState: setUndoRedoState,
        undo: undoRedoUndo,
        redo: undoRedoRedo,
        canUndo,
        canRedo,
        historySize,
        redoSize
    } = useUndoRedo(initialState, 50);

    const prevUndoRedoStateRef = useRef(undoRedoState);

    const { scheduleSync, isOnline, isSyncing, resolveConflict: syncResolve } = useOfflineSync({
        syncInterval: 30000,
        onSyncError: (error, operation) => {
            if (!error.isOffline) {
                restorePreviousState();
                setSyncErrors(prev => [...prev, {
                    id: Date.now(),
                    message: error.message || 'Failed to sync',
                    operation: operation.type,
                    timestamp: Date.now()
                }]);
                setTimeout(() => setSyncErrors(prev => prev.slice(1)), 5000);
                refreshBoard();
            }
        },
        onConflict: conflict => setConflicts(prev => [...prev, conflict])
    });

    // ---------------------
    // Helper: restore previous state
    const restorePreviousState = () => {
        if (previousStateRef.current) {
            isRestoringRef.current = true;
            dispatch({ type: 'REVERT_OPTIMISTIC_UPDATE', payload: { previousState: previousStateRef.current } });
            previousStateRef.current = null;
            setTimeout(() => isRestoringRef.current = false, 50);
        }
    };

    // ---------------------
    // Refresh board from server + merge with local
    const refreshBoard = useCallback(async () => {
        try {
            const serverData = await apiClient.getBoard();
            if (!serverData?.columns?.length) return;

            const localData = await loadBoard();
            const mergedColumns = [...localData.columns];

            serverData.columns.forEach(serverCol => {
                const localIndex = mergedColumns.findIndex(c => c.id === serverCol.id);
                if (localIndex >= 0) {
                    const localCol = mergedColumns[localIndex];
                    const mergedCards = [...localCol.cards];

                    serverCol.cards.forEach(serverCard => {
                        const localCardIndex = mergedCards.findIndex(c => c.id === serverCard.id);
                        if (localCardIndex >= 0) mergedCards[localCardIndex] = serverCard;
                        else mergedCards.push(serverCard);
                    });

                    mergedColumns[localIndex] = { ...serverCol, cards: mergedCards.sort((a, b) => (a.order_id || 0) - (b.order_id || 0)) };
                } else {
                    mergedColumns.push(serverCol);
                }
            });

            mergedColumns.sort((a, b) => (a.order || 0) - (b.order || 0));

            isRestoringRef.current = true;
            dispatch({ type: 'INIT_BOARD', payload: { columns: mergedColumns } });

            for (const column of mergedColumns) {
                const { cards, ...listData } = column;
                await saveList(listData);
                for (const card of cards) await saveCard(card);
            }

        } catch (e) {
            if (process.env.NODE_ENV === 'development') console.log("Offline mode / server error", e);
        } finally {
            setTimeout(() => isRestoringRef.current = false, 100);
        }
    }, []);

    // ---------------------
    // Undo/Redo handlers
    const undo = useCallback(() => {
        if (!canUndo) return;
        isRestoringRef.current = true;
        undoRedoUndo();
        previousStateRef.current = null;
    }, [canUndo, undoRedoUndo]);

    const redo = useCallback(() => {
        if (!canRedo) return;
        isRestoringRef.current = true;
        undoRedoRedo();
        previousStateRef.current = null;
    }, [canRedo, undoRedoRedo]);

    useEffect(() => {
        if (isRestoringRef.current && prevUndoRedoStateRef.current !== undoRedoState) {
            dispatch({ type: 'REVERT_OPTIMISTIC_UPDATE', payload: { previousState: undoRedoState } });
            setTimeout(() => isRestoringRef.current = false, 50);
        }
        prevUndoRedoStateRef.current = undoRedoState;
    }, [undoRedoState]);

    // Keyboard shortcuts
    useEffect(() => {
        const handler = (e) => {
            if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'z' && !e.shiftKey) undo();
            if ((e.ctrlKey || e.metaKey) && (e.key.toLowerCase() === 'y' || (e.key.toLowerCase() === 'z' && e.shiftKey))) redo();
        };
        window.addEventListener('keydown', handler);
        return () => window.removeEventListener('keydown', handler);
    }, [undo, redo]);

    // ---------------------
    // Load board on mount
    useEffect(() => {
        const load = async () => {
            try {
                const data = await loadBoard();
                if (data.columns.length) {
                    isRestoringRef.current = true;
                    dispatch({ type: 'INIT_BOARD', payload: data });
                    setTimeout(() => isRestoringRef.current = false, 100);
                } else if (navigator.onLine) refreshBoard();
            } catch (e) { console.error("Failed to load board", e); }
        };
        load();
    }, [refreshBoard]);

    // ---------------------
    // Custom dispatch with optimistic updates + persistence
    const customDispatch = async (action) => {
        if (['INIT_BOARD', 'REVERT_OPTIMISTIC_UPDATE'].includes(action.type)) {
            isRestoringRef.current = true;
            dispatch(action);
            setTimeout(() => isRestoringRef.current = false, 50);
            return;
        }

        previousStateRef.current = JSON.parse(JSON.stringify(state));
        setUndoRedoState(state, true);

        switch (action.type) {
            case 'ADD_LIST': {
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
                dispatch({ type: 'ADD_LIST', payload: { id: listId, title: action.payload, version: 1 } });
                try { await saveList(newList); scheduleSync({ type: 'ADD_LIST', payload: newList }); previousStateRef.current = null; }
                catch { restorePreviousState(); }
                break;
            }

            case 'ADD_CARD': {
                const cardId = uuidv4();
                const { columnId, title } = action.payload;
                const column = state.columns.find(c => c.id === columnId);
                const newCard = {
                    id: cardId,
                    title,
                    description: '',
                    list_id: columnId,
                    order_id: column?.cards.length || 0,
                    last_modified: Date.now(),
                    version: 1,
                    lastModifiedAt: Date.now(),
                    tags: []
                };
                dispatch({ type: 'ADD_CARD', payload: { ...action.payload, id: cardId, version: 1 } });
                try { await saveCard(newCard); scheduleSync({ type: 'ADD_CARD', payload: newCard }); previousStateRef.current = null; }
                catch { restorePreviousState(); }
                break;
            }

            default:
                dispatch(action);
                break;
        }

        // For persistence actions like MOVE, UPDATE, DELETE, handle separately
        try {
            switch (action.type) {
                case 'DELETE_CARD':
                    const cardToDelete = state.columns.flatMap(c => c.cards).find(c => c.id === action.payload);
                    await deleteCard(action.payload);
                    scheduleSync({ type: 'DELETE_CARD', payload: action.payload, baseVersion: cardToDelete });
                    previousStateRef.current = null;
                    break;
                case 'UPDATE_CARD': {
                    const col = state.columns.find(c => c.cards.some(card => card.id === action.payload.id));
                    const card = col?.cards.find(c => c.id === action.payload.id);
                    if (card) {
                        const baseVersion = { ...card };
                        const updatedCard = { ...card, ...action.payload.updates, version: (card.version || 1) + 1, last_modified: Date.now() };
                        await saveCard(updatedCard);
                        scheduleSync({ type: 'UPDATE_CARD', payload: { id: card.id, updates: action.payload.updates }, baseVersion });
                        previousStateRef.current = null;
                    }
                    break;
                }
            }
        } catch (e) { restorePreviousState(); }
    };

    const persistListOrder = async (lists) => await updateListsOrder(lists);
    const persistCardOrder = async (cards) => await updateCardsOrder(cards);
    const dismissError = useCallback((id) => setSyncErrors(prev => prev.filter(e => e.id !== id)), []);

    const resolveConflict = async (conflictId, resolution) => {
        const conflict = conflicts.find(c => c.id === conflictId);
        if (!conflict) return;
        await syncResolve(conflictId, resolution, conflict.server);
        setConflicts(prev => prev.filter(c => c.id !== conflictId));
        if (resolution === 'server') refreshBoard();
    };

    return (
        <BoardContext.Provider value={{
            state,
            dispatch: customDispatch,
            undo, redo, canUndo, canRedo, historySize, redoSize,
            persistListOrder, persistCardOrder,
            isOnline, isSyncing, refreshBoard,
            conflicts, resolveConflict,
            syncErrors, dismissError
        }}>
            {children}
        </BoardContext.Provider>
    );
};

export const useBoard = () => {
    const context = useContext(BoardContext);
    if (!context) throw new Error('useBoard must be used within a BoardProvider');
    return context;
};
