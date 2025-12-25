import { useCallback } from 'react';
import { useBoard } from '../context/BoardProvider';
import { v4 as uuidv4 } from 'uuid';


export const useBoardState = () => {
    const { state, dispatch } = useBoard();

    const addList = useCallback((title) => {
        if (!title || !title.trim()) {
            console.warn('useBoardState: Cannot add list with empty title');
            return;
        }
        dispatch({ type: 'ADD_LIST', payload: title.trim() });
    }, [dispatch]);


    const addCard = useCallback((columnId, title) => {
        if (!columnId) {
            console.warn('useBoardState: Cannot add card without columnId');
            return null;
        }
        if (!title || !title.trim()) {
            console.warn('useBoardState: Cannot add card with empty title');
            return null;
        }
        const cardId = uuidv4();
        dispatch({
            type: 'ADD_CARD',
            payload: { columnId, title: title.trim(), id: cardId }
        });
        return cardId;
    }, [dispatch]);


    const updateCard = useCallback((cardId, updates) => {
        if (!cardId) {
            console.warn('useBoardState: Cannot update card without cardId');
            return;
        }
        if (!updates || typeof updates !== 'object') {
            console.warn('useBoardState: Updates must be an object');
            return;
        }
        dispatch({
            type: 'UPDATE_CARD',
            payload: { id: cardId, updates }
        });
    }, [dispatch]);


    const deleteCard = useCallback((cardId) => {
        if (!cardId) {
            console.warn('useBoardState: Cannot delete card without cardId');
            return;
        }
        dispatch({ type: 'DELETE_CARD', payload: cardId });
    }, [dispatch]);


    const editListTitle = useCallback((listId, newTitle) => {
        if (!listId) {
            console.warn('useBoardState: Cannot edit list without listId');
            return;
        }
        if (!newTitle || !newTitle.trim()) {
            console.warn('useBoardState: Cannot set list title to empty');
            return;
        }
        dispatch({
            type: 'EDIT_LIST_TITLE',
            payload: { id: listId, title: newTitle.trim() }
        });
    }, [dispatch]);

    const archiveList = useCallback((listId) => {
        if (!listId) {
            console.warn('useBoardState: Cannot archive list without listId');
            return;
        }
        dispatch({ type: 'ARCHIVE_LIST', payload: listId });
    }, [dispatch]);

    const moveList = useCallback((activeId, overId) => {
        if (!activeId || !overId) {
            console.warn('useBoardState: Cannot move list without both activeId and overId');
            return;
        }
        if (activeId === overId) {
            return; // No-op if moving to same position
        }
        dispatch({
            type: 'MOVE_LIST',
            payload: { activeId, overId }
        });
    }, [dispatch]);


    const moveCard = useCallback((activeId, overId, activeColumnId, overColumnId) => {
        if (!activeId || !activeColumnId || !overColumnId) {
            console.warn('useBoardState: Cannot move card without required IDs');
            return;
        }
        dispatch({
            type: 'MOVE_CARD',
            payload: { activeId, overId, activeColumnId, overColumnId }
        });
    }, [dispatch]);


    const findCardById = useCallback((cardId) => {
        if (!cardId) return null;
        for (const column of state.columns) {
            const card = column.cards.find(c => c.id === cardId);
            if (card) return card;
        }
        return null;
    }, [state.columns]);


    const findListById = useCallback((listId) => {
        if (!listId) return null;
        return state.columns.find(col => col.id === listId) || null;
    }, [state.columns]);

    return {
        columns: state.columns,
        addList,
        addCard,
        updateCard,
        deleteCard,
        editListTitle,
        archiveList,
        moveList,
        moveCard,
        findCardById,
        findListById,
    };
};
