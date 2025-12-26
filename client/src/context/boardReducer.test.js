import { boardReducer } from './boardReducer';

describe('boardReducer', () => {
    const initialState = {
        columns: [
            { id: 'l1', title: 'List 1', cards: [{ id: 'c1', title: 'Card 1' }] }
        ]
    };

    test('SET_BOARD sets the entire state', () => {
        const newState = { columns: [] };
        const action = { type: 'SET_BOARD', payload: newState };
        expect(boardReducer(initialState, action)).toEqual(newState);
    });

    test('ADD_LIST adds a new list', () => {
        const newList = { id: 'l2', title: 'List 2', cards: [] };
        const action = { type: 'ADD_LIST', payload: newList };
        const state = boardReducer(initialState, action);
        expect(state.columns).toHaveLength(2);
        expect(state.columns[1]).toEqual(newList);
    });

    test('ADD_CARD adds card to correct list', () => {
        const newCard = { id: 'c2', title: 'Card 2', list_id: 'l1' };
        const action = { type: 'ADD_CARD', payload: { listId: 'l1', card: newCard } };
        const state = boardReducer(initialState, action);
        expect(state.columns[0].cards).toHaveLength(2);
        expect(state.columns[0].cards[1]).toEqual(newCard);
    });

    test('UPDATE_CARD updates card properties', () => {
        const updates = { title: 'Updated Title' };
        const action = { type: 'UPDATE_CARD', payload: { id: 'c1', updates } };
        const state = boardReducer(initialState, action);
        expect(state.columns[0].cards[0].title).toBe('Updated Title');
    });

    test('DELETE_CARD removes card', () => {
        const action = { type: 'DELETE_CARD', payload: 'c1' };
        const state = boardReducer(initialState, action);
        expect(state.columns[0].cards).toHaveLength(0);
    });

    test('EDIT_LIST_TITLE updates list title', () => {
        const action = { type: 'EDIT_LIST_TITLE', payload: { id: 'l1', title: 'New List Name' } };
        const state = boardReducer(initialState, action);
        expect(state.columns[0].title).toBe('New List Name');
    });

    test('ARCHIVE_LIST removes list', () => {
        const action = { type: 'ARCHIVE_LIST', payload: 'l1' };
        const state = boardReducer(initialState, action);
        expect(state.columns).toHaveLength(0);
    });

    test('MOVE_LIST reorders columns', () => {
        const stateWithTwo = {
            columns: [{ id: 'l1' }, { id: 'l2' }]
        };
        const action = { type: 'MOVE_LIST', payload: { activeId: 'l1', overId: 'l2' } };
        const state = boardReducer(stateWithTwo, action);
        expect(state.columns[0].id).toBe('l2');
        expect(state.columns[1].id).toBe('l1');
    });

    test('MOVE_CARD between lists', () => {
        const complexState = {
            columns: [
                { id: 'l1', cards: [{ id: 'c1' }] },
                { id: 'l2', cards: [] }
            ]
        };
        const action = {
            type: 'MOVE_CARD',
            payload: { activeId: 'c1', overId: 'l2', activeContainer: 'l1', overContainer: 'l2' }
        };
        const state = boardReducer(complexState, action);
        expect(state.columns[0].cards).toHaveLength(0);
        expect(state.columns[1].cards).toHaveLength(1);
        expect(state.columns[1].cards[0].id).toBe('c1');
    });

    test('returns state for unknown action', () => {
        expect(boardReducer(initialState, { type: 'UNKNOWN' })).toBe(initialState);
    });
});
