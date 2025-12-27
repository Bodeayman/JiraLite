import { useState, useCallback, useRef, useEffect } from 'react';

export const useUndoRedo = (initialState, maxHistorySize = 50) => {
    const [currentState, setCurrentState] = useState(initialState);
    const [undoStack, setUndoStack] = useState([]);
    const [redoStack, setRedoStack] = useState([]);


    const isUndoingRef = useRef(false);
    const isRedoingRef = useRef(false);


    const initialStateRef = useRef(initialState);


    useEffect(() => {
        initialStateRef.current = initialState;
    }, [initialState]);


    const setState = useCallback((newState, addToHistory = true) => {

        if (isUndoingRef.current || isRedoingRef.current) {
            setCurrentState(newState);
            return;
        }

        if (addToHistory) {
            setUndoStack(prev => {
                const updated = [...prev, currentState];

                if (updated.length > maxHistorySize) {
                    updated.shift();
                }
                return updated;
            });

            setRedoStack([]);
        }

        setCurrentState(newState);
    }, [currentState, maxHistorySize]);


    const undo = useCallback(() => {
        if (undoStack.length === 0) {
            console.warn('useUndoRedo: Nothing to undo');
            return;
        }

        isUndoingRef.current = true;

        setRedoStack(prev => [...prev, currentState]);
        const previousState = undoStack[undoStack.length - 1];
        setUndoStack(prev => prev.slice(0, -1));
        setCurrentState(previousState);


        setTimeout(() => {
            isUndoingRef.current = false;
        }, 0);
    }, [undoStack, currentState]);

    const redo = useCallback(() => {
        if (redoStack.length === 0) {
            console.warn('useUndoRedo: Nothing to redo');
            return;
        }

        isRedoingRef.current = true;

        setUndoStack(prev => [...prev, currentState]);
        const nextState = redoStack[redoStack.length - 1];
        setRedoStack(prev => prev.slice(0, -1));
        setCurrentState(nextState);


        setTimeout(() => {
            isRedoingRef.current = false;
        }, 0);
    }, [redoStack, currentState]);


    const clearHistory = useCallback(() => {
        setUndoStack([]);
        setRedoStack([]);
    }, []);


    const reset = useCallback(() => {
        setCurrentState(initialStateRef.current);
        clearHistory();
    }, [clearHistory]);


    const historySize = undoStack.length;


    const redoSize = redoStack.length;


    const canUndo = historySize > 0;


    const canRedo = redoSize > 0;

    return {
        currentState,
        canUndo,
        canRedo,
        historySize,
        redoSize,
        setState,
        undo,
        redo,
        clearHistory,
        reset,
    };
};


export const useBoardUndoRedo = (initialState, dispatch, maxHistorySize = 50) => {
    const undoRedo = useUndoRedo(initialState, maxHistorySize);


    const dispatchWithUndo = useCallback((action) => {

        if (dispatch) {
            dispatch(action);
        }








        console.log('useBoardUndoRedo: Action dispatched:', action);
    }, [dispatch]);

    return {
        ...undoRedo,
        dispatchWithUndo,
    };
};
