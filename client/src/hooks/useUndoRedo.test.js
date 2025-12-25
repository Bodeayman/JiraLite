import { renderHook, act } from '@testing-library/react';
import { useUndoRedo } from './useUndoRedo';

describe('useUndoRedo', () => {
    const initialState = { count: 0, name: 'initial' };

    test('should initialize with initial state', () => {
        const { result } = renderHook(() => useUndoRedo(initialState));

        expect(result.current.currentState).toEqual(initialState);
        expect(result.current.canUndo).toBe(false);
        expect(result.current.canRedo).toBe(false);
        expect(result.current.historySize).toBe(0);
        expect(result.current.redoSize).toBe(0);
    });

    test('should update state and add to history', () => {
        const { result } = renderHook(() => useUndoRedo(initialState));

        act(() => {
            result.current.setState({ count: 1, name: 'first' });
        });

        expect(result.current.currentState).toEqual({ count: 1, name: 'first' });
        expect(result.current.canUndo).toBe(true);
        expect(result.current.historySize).toBe(1);
    });

    test('should undo last operation', () => {
        const { result } = renderHook(() => useUndoRedo(initialState));

        act(() => {
            result.current.setState({ count: 1, name: 'first' });
        });

        expect(result.current.currentState.count).toBe(1);

        act(() => {
            result.current.undo();
        });

        expect(result.current.currentState).toEqual(initialState);
        expect(result.current.canUndo).toBe(false);
        expect(result.current.canRedo).toBe(true);
        expect(result.current.redoSize).toBe(1);
    });

    test('should redo last undone operation', () => {
        const { result } = renderHook(() => useUndoRedo(initialState));

        act(() => {
            result.current.setState({ count: 1, name: 'first' });
        });

        act(() => {
            result.current.undo();
        });

        expect(result.current.currentState).toEqual(initialState);

        act(() => {
            result.current.redo();
        });

        expect(result.current.currentState).toEqual({ count: 1, name: 'first' });
        expect(result.current.canUndo).toBe(true);
        expect(result.current.canRedo).toBe(false);
    });

    test('should support multiple undo/redo operations', () => {
        const { result } = renderHook(() => useUndoRedo(initialState));

        // Perform multiple state changes
        act(() => {
            result.current.setState({ count: 1, name: 'first' });
        });
        act(() => {
            result.current.setState({ count: 2, name: 'second' });
        });
        act(() => {
            result.current.setState({ count: 3, name: 'third' });
        });

        expect(result.current.currentState.count).toBe(3);
        expect(result.current.historySize).toBe(3);

        // Undo twice
        act(() => {
            result.current.undo();
        });
        expect(result.current.currentState.count).toBe(2);

        act(() => {
            result.current.undo();
        });
        expect(result.current.currentState.count).toBe(1);

        // Redo once
        act(() => {
            result.current.redo();
        });
        expect(result.current.currentState.count).toBe(2);
    });

    test('should clear redo stack when new action is performed', () => {
        const { result } = renderHook(() => useUndoRedo(initialState));

        act(() => {
            result.current.setState({ count: 1, name: 'first' });
        });

        act(() => {
            result.current.undo();
        });

        expect(result.current.canRedo).toBe(true);

        // Perform new action
        act(() => {
            result.current.setState({ count: 5, name: 'new' });
        });

        expect(result.current.canRedo).toBe(false);
        expect(result.current.redoSize).toBe(0);
    });

    test('should limit history size', () => {
        const { result } = renderHook(() => useUndoRedo(initialState, 3));

        // Add more operations than maxHistorySize
        for (let i = 1; i <= 5; i++) {
            act(() => {
                result.current.setState({ count: i, name: `state-${i}` });
            });
        }

        // History should be limited to maxHistorySize
        expect(result.current.historySize).toBeLessThanOrEqual(3);
    });

    test('should clear history', () => {
        const { result } = renderHook(() => useUndoRedo(initialState));

        act(() => {
            result.current.setState({ count: 1, name: 'first' });
        });
        act(() => {
            result.current.setState({ count: 2, name: 'second' });
        });

        expect(result.current.historySize).toBeGreaterThan(0);

        act(() => {
            result.current.clearHistory();
        });

        expect(result.current.historySize).toBe(0);
        expect(result.current.redoSize).toBe(0);
        expect(result.current.canUndo).toBe(false);
        expect(result.current.canRedo).toBe(false);
    });

    test('should reset to initial state', () => {
        const { result } = renderHook(() => useUndoRedo(initialState));

        act(() => {
            result.current.setState({ count: 1, name: 'first' });
        });
        act(() => {
            result.current.setState({ count: 2, name: 'second' });
        });

        expect(result.current.currentState.count).toBe(2);

        act(() => {
            result.current.reset();
        });

        expect(result.current.currentState).toEqual(initialState);
        expect(result.current.historySize).toBe(0);
        expect(result.current.redoSize).toBe(0);
    });

    test('should not add to history when addToHistory is false', () => {
        const { result } = renderHook(() => useUndoRedo(initialState));

        act(() => {
            result.current.setState({ count: 1, name: 'first' });
        });

        const historySizeBefore = result.current.historySize;

        act(() => {
            result.current.setState({ count: 2, name: 'second' }, false);
        });

        expect(result.current.currentState.count).toBe(2);
        expect(result.current.historySize).toBe(historySizeBefore);
    });

    test('should handle undo when nothing to undo', () => {
        const { result } = renderHook(() => useUndoRedo(initialState));
        const consoleSpy = jest.spyOn(console, 'warn').mockImplementation();

        act(() => {
            result.current.undo();
        });

        expect(consoleSpy).toHaveBeenCalledWith('useUndoRedo: Nothing to undo');
        consoleSpy.mockRestore();
    });

    test('should handle redo when nothing to redo', () => {
        const { result } = renderHook(() => useUndoRedo(initialState));
        const consoleSpy = jest.spyOn(console, 'warn').mockImplementation();

        act(() => {
            result.current.redo();
        });

        expect(consoleSpy).toHaveBeenCalledWith('useUndoRedo: Nothing to redo');
        consoleSpy.mockRestore();
    });

    test('should maintain state consistency during undo/redo', () => {
        const { result } = renderHook(() => useUndoRedo(initialState));

        const states = [
            { count: 1, name: 'first' },
            { count: 2, name: 'second' },
            { count: 3, name: 'third' },
        ];

        // Apply all states
        states.forEach(state => {
            act(() => {
                result.current.setState(state);
            });
        });

        // Undo all
        states.reverse().forEach((state, index) => {
            act(() => {
                result.current.undo();
            });
            const expectedState = index === states.length - 1
                ? initialState
                : states[states.length - 2 - index];
            expect(result.current.currentState).toEqual(expectedState);
        });

        // Redo all
        states.forEach(state => {
            act(() => {
                result.current.redo();
            });
            expect(result.current.currentState).toEqual(state);
        });
    });
});

