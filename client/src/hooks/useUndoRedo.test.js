import { renderHook, act } from '@testing-library/react';
import { useUndoRedo } from '../hooks/useUndoRedo';

describe('useUndoRedo', () => {
    it('should initialize with initial state', () => {
        const initialState = { count: 0 };
        const { result } = renderHook(() => useUndoRedo(initialState));

        expect(result.current.currentState).toEqual(initialState);
        expect(result.current.canUndo).toBe(false);
        expect(result.current.canRedo).toBe(false);
    });

    it('should update state and track history', () => {
        const { result } = renderHook(() => useUndoRedo({ count: 0 }));

        act(() => {
            result.current.setState({ count: 1 });
        });

        expect(result.current.currentState).toEqual({ count: 1 });
        expect(result.current.canUndo).toBe(true);
        expect(result.current.historySize).toBe(1);
    });

    it('should undo state', () => {
        const { result } = renderHook(() => useUndoRedo({ count: 0 }));

        act(() => {
            result.current.setState({ count: 1 });
        });

        act(() => {
            result.current.undo();
        });

        expect(result.current.currentState).toEqual({ count: 0 });
        expect(result.current.canUndo).toBe(false);
        expect(result.current.canRedo).toBe(true);
    });

    it('should redo state', () => {
        const { result } = renderHook(() => useUndoRedo({ count: 0 }));

        act(() => {
            result.current.setState({ count: 1 });
        });

        act(() => {
            result.current.undo();
        });

        act(() => {
            result.current.redo();
        });

        expect(result.current.currentState).toEqual({ count: 1 });
    });
});
