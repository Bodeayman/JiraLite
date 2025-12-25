import { boardReducer, initialState } from './boardReducer';

describe('boardReducer Integration', () => {
    it('should add a new list', () => {
        const action = {
            type: 'ADD_LIST',
            payload: { id: 'list-1', title: 'New List' }
        };
        const newState = boardReducer(initialState, action);
        expect(newState.columns).toHaveLength(1);
        expect(newState.columns[0]).toEqual(expect.objectContaining({
            id: 'list-1',
            title: 'New List',
            cards: []
        }));
    });

    it('should add a card to a list', () => {
        const startState = {
            columns: [{ id: 'list-1', title: 'List 1', cards: [] }]
        };
        const action = {
            type: 'ADD_CARD',
            payload: { id: 'card-1', title: 'New Card', columnId: 'list-1' }
        };
        const newState = boardReducer(startState, action);
        expect(newState.columns[0].cards).toHaveLength(1);
        expect(newState.columns[0].cards[0].title).toBe('New Card');
    });

    it('should move a card between lists', () => {
        const startState = {
            columns: [
                { id: 'list-1', title: 'List 1', cards: [{ id: 'c1', title: 'C1' }] },
                { id: 'list-2', title: 'List 2', cards: [] }
            ]
        };
        const action = {
            type: 'MOVE_CARD',
            payload: {
                activeId: 'c1',
                activeColumnId: 'list-1',
                overColumnId: 'list-2',
                overId: null
            }
        };
        // Logic for MOVE_CARD in reducer might rely on array manipulation
        // Let's verify standard dnd-kit payload structure support
        const newState = boardReducer(startState, action);

        expect(newState.columns[0].cards).toHaveLength(0);
        expect(newState.columns[1].cards).toHaveLength(1);
        expect(newState.columns[1].cards[0].id).toBe('c1');
    });
});
