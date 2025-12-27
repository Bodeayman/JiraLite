import { renderHook, act } from '@testing-library/react';
import { useUndoRedo } from './useUndoRedo';

describe('useUndoRedo', () => {
    test('initializes with correct state', () => {
        const { result } = renderHook(() => useUndoRedo({ columns: [] }));

        expect(result.current.canUndo).toBe(false);
        expect(result.current.canRedo).toBe(false);
    });

    test('adds state to history', () => {
        const { result } = renderHook(() => useUndoRedo({ columns: [] }));

        act(() => {
            result.current.addToHistory({ columns: [{ id: '1', title: 'Test' }] });
        });

        expect(result.current.canUndo).toBe(true);
        expect(result.current.canRedo).toBe(false);
    });

    test('undo restores previous state', () => {
        const initialState = { columns: [] };
        const { result } = renderHook(() => useUndoRedo(initialState));

        const newState = { columns: [{ id: '1', title: 'Test' }] };

        act(() => {
            result.current.addToHistory(newState);
        });

        let undoneState;
        act(() => {
            undoneState = result.current.undo();
        });

        expect(undoneState).toEqual(initialState);
        expect(result.current.canRedo).toBe(true);
    });

    test('redo restores next state', () => {
        const initialState = { columns: [] };
        const { result } = renderHook(() => useUndoRedo(initialState));

        const newState = { columns: [{ id: '1', title: 'Test' }] };

        act(() => {
            result.current.addToHistory(newState);
            result.current.undo();
        });

        let redoneState;
        act(() => {
            redoneState = result.current.redo();
        });

        expect(redoneState).toEqual(newState);
    });

    test('clears redo stack on new action', () => {
        const { result } = renderHook(() => useUndoRedo({ columns: [] }));

        act(() => {
            result.current.addToHistory({ columns: [{ id: '1', title: 'Test 1' }] });
            result.current.undo();
            result.current.addToHistory({ columns: [{ id: '2', title: 'Test 2' }] });
        });

        expect(result.current.canRedo).toBe(false);
    });
});
