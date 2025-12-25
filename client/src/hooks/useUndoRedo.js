import { useState, useCallback, useRef, useEffect } from 'react';

export const useUndoRedo = (initialState, maxHistorySize = 50) => {
    const [currentState, setCurrentState] = useState(initialState);
    const [undoStack, setUndoStack] = useState([]);
    const [redoStack, setRedoStack] = useState([]);

    // Track if we're currently performing undo/redo to avoid adding to history
    const isUndoingRef = useRef(false);
    const isRedoingRef = useRef(false);

    // Track initial state for reset functionality
    const initialStateRef = useRef(initialState);


    useEffect(() => {
        initialStateRef.current = initialState;
    }, [initialState]);


    const setState = useCallback((newState, addToHistory = true) => {
        // Don't add to history if we're undoing/redoing
        if (isUndoingRef.current || isRedoingRef.current) {
            setCurrentState(newState);
            return;
        }

        if (addToHistory) {
            setUndoStack(prev => {
                const updated = [...prev, currentState];
                // Limit history size
                if (updated.length > maxHistorySize) {
                    updated.shift(); // Remove oldest entry
                }
                return updated;
            });
            // Clear redo stack when new action is performed
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

        // Reset flag after state update
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

        // Reset flag after state update
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
        // Dispatch the action first
        if (dispatch) {
            dispatch(action);
        }

        // Note: In a real implementation, you'd need to capture the new state
        // after dispatch. This requires either:
        // 1. Using a reducer that returns the new state
        // 2. Subscribing to state changes
        // 3. Computing the new state from the action

        // For now, this is a placeholder that shows the pattern
        console.log('useBoardUndoRedo: Action dispatched:', action);
    }, [dispatch]);

    return {
        ...undoRedo,
        dispatchWithUndo,
    };
};
