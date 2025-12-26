import * as storage from './storage';
import 'fake-indexeddb/auto';

describe('storage service', () => {
    beforeEach(async () => {
        await storage.clearQueue();
    });

    test('saveList and loadBoard', async () => {
        const list = { id: 'l1', title: 'List 1', order: 1 };
        await storage.saveList(list);
        const board = await storage.loadBoard();
        expect(board.columns).toHaveLength(1);
        expect(board.columns[0].title).toBe('List 1');
    });

    test('saveCard and deleteCard', async () => {
        const card = { id: 'c1', list_id: 'l1', title: 'Card 1', order_id: 1 };
        await storage.saveCard(card);
        let board = await storage.loadBoard();
        expect(board.columns[0].cards).toHaveLength(1);

        await storage.deleteCard('c1');
        board = await storage.loadBoard();
        expect(board.columns[0].cards).toHaveLength(0);
    });

    test('addToQueue and getQueue', async () => {
        const action = { type: 'TEST', payload: {} };
        await storage.addToQueue(action);
        const queue = await storage.getQueue();
        expect(queue).toHaveLength(1);
        expect(queue[0].val.type).toBe('TEST');
    });

    test('removeFromQueue', async () => {
        const action = { type: 'TEST' };
        const key = await storage.addToQueue(action);
        await storage.removeFromQueue(key);
        const queue = await storage.getQueue();
        expect(queue).toHaveLength(0);
    });
});
