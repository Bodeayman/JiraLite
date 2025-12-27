import { renderHook, act } from '@testing-library/react';
import { useBoardState } from './useBoardState';
import { BoardContext } from '../context/BoardProvider';
import { useReducer } from 'react';
import boardReducer, { initialState } from '../context/boardReducer';

// Mock the storage module
jest.mock('../services/storage');

// Create a minimal test wrapper
const createWrapper = () => {
    const TestWrapper = ({ children }) => {
        const [board, dispatch] = useReducer(boardReducer, initialState);

        const contextValue = {
            board,
            dispatch,
            loading: false,
            error: null,
        };

        return (
            <BoardContext.Provider value={contextValue}>
                {children}
            </BoardContext.Provider>
        );
    };
    return TestWrapper;
};

describe('useBoardState', () => {
    beforeEach(() => {
        jest.clearAllMocks();
    });

    test('addList dispatches trimmed title and ignores empty', async () => {
        const wrapper = createWrapper();
        const { result } = renderHook(() => useBoardState(), { wrapper });

        await act(async () => {
            result.current.addList('  Test List  ');
        });

        expect(result.current.board.columns).toHaveLength(1);
        expect(result.current.board.columns[0].title).toBe('Test List');

        await act(async () => {
            result.current.addList('');
        });

        expect(result.current.board.columns).toHaveLength(1);
    });

    test('addCard dispatches correct payload and ignores invalid', async () => {
        const wrapper = createWrapper();
        const { result } = renderHook(() => useBoardState(), { wrapper });

        await act(async () => {
            result.current.addList('Column 1');
        });

        const columnId = result.current.board.columns[0].id;

        await act(async () => {
            result.current.addCard(columnId, 'Card 1');
        });

        expect(result.current.board.columns[0].cards).toHaveLength(1);
        expect(result.current.board.columns[0].cards[0].title).toBe('Card 1');

        await act(async () => {
            result.current.addCard(columnId, '');
        });

        expect(result.current.board.columns[0].cards).toHaveLength(1);
    });

    test('updateCard updates card correctly', async () => {
        const wrapper = createWrapper();
        const { result } = renderHook(() => useBoardState(), { wrapper });

        await act(async () => {
            result.current.addList('Column 1');
        });

        const columnId = result.current.board.columns[0].id;

        await act(async () => {
            result.current.addCard(columnId, 'Card 1');
        });

        const cardId = result.current.board.columns[0].cards[0].id;

        await act(async () => {
            result.current.updateCard(cardId, { title: 'Updated Card' });
        });

        expect(result.current.board.columns[0].cards[0].title).toBe('Updated Card');
    });

    test('deleteCard removes card from board', async () => {
        const wrapper = createWrapper();
        const { result } = renderHook(() => useBoardState(), { wrapper });

        await act(async () => {
            result.current.addList('Column 1');
        });

        const columnId = result.current.board.columns[0].id;

        await act(async () => {
            result.current.addCard(columnId, 'Card 1');
        });

        const cardId = result.current.board.columns[0].cards[0].id;

        await act(async () => {
            result.current.deleteCard(cardId);
        });

        expect(result.current.board.columns[0].cards).toHaveLength(0);
    });

    test('moveCard updates card position', async () => {
        const wrapper = createWrapper();
        const { result } = renderHook(() => useBoardState(), { wrapper });

        await act(async () => {
            result.current.addList('Column 1');
        });

        const columnId = result.current.board.columns[0].id;

        await act(async () => {
            result.current.addCard(columnId, 'Card 1');
            result.current.addCard(columnId, 'Card 2');
        });

        const cardId = result.current.board.columns[0].cards[0].id;

        await act(async () => {
            result.current.moveCard(cardId, columnId, 1);
        });

        expect(result.current.board.columns[0].cards[0].title).toBe('Card 2');
        expect(result.current.board.columns[0].cards[1].title).toBe('Card 1');
    });
});
