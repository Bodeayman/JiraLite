
import express from 'express';
import cors from 'cors';

const app = express();
app.use(cors());
app.use(express.json());


let serverLists = [];
let serverCards = [];


let CONFIG = {
    latency: 500,
    failureRate: 0,
};


const simulateNetwork = (req, res, next) => {
    setTimeout(() => {
        if (Math.random() < CONFIG.failureRate) {
            return res.status(500).json({ error: 'Simulated Network Failure' });
        }
        next();
    }, CONFIG.latency);
};

app.use(simulateNetwork);


app.post('/api/config', (req, res) => {
    CONFIG = { ...CONFIG, ...req.body };
    res.json({ message: 'Config updated', config: CONFIG });
});




app.get('/api/board', (req, res) => {


    const lists = serverLists.sort((a, b) => a.order - b.order).map(list => {
        const cards = serverCards
            .filter(c => c.list_id === list.id)
            .sort((a, b) => a.order_id - b.order_id);
        return { ...list, cards };
    });
    res.json({ columns: lists });
});


app.post('/api/reset', (req, res) => {
    serverLists = [];
    serverCards = [];
    res.json({ message: 'Board reset' });
});



app.post('/api/lists', (req, res) => {
    const list = req.body;

    if (!list.id || !list.title) return res.status(400).json({ error: 'Missing fields' });


    const existing = serverLists.find(l => l.id === list.id);
    if (existing) {
        return res.json(existing);
    }

    const newList = {
        ...list,
        version: 1,
        lastModifiedAt: Date.now()
    };

    serverLists.push(newList);
    res.json(newList);
});

app.put('/api/lists/:id', (req, res) => {
    const { id } = req.params;
    const updates = req.body;
    const index = serverLists.findIndex(l => l.id === id);

    if (index === -1) return res.status(404).json({ error: 'List not found' });

    const serverItem = serverLists[index];




    if (updates.version !== undefined && updates.version !== serverItem.version) {
        return res.status(409).json({
            error: 'Conflict',
            serverItem: serverItem,
            message: 'Server has a newer version of this list.'
        });
    }

    serverLists[index] = {
        ...serverItem,
        ...updates,
        version: serverItem.version + 1,
        lastModifiedAt: Date.now()
    };
    res.json(serverLists[index]);
});

app.delete('/api/lists/:id', (req, res) => {
    const { id } = req.params;








    serverLists = serverLists.filter(l => l.id !== id);

    serverCards = serverCards.filter(c => c.list_id !== id);
    res.json({ success: true, id });
});



app.post('/api/cards', (req, res) => {
    const card = req.body;
    if (!card.id || !card.list_id || !card.title) return res.status(400).json({ error: 'Missing fields' });

    const existing = serverCards.find(c => c.id === card.id);
    if (existing) {
        return res.json(existing);
    }

    const newCard = {
        ...card,
        version: 1,
        lastModifiedAt: Date.now()
    };

    serverCards.push(newCard);
    res.json(newCard);
});

app.put('/api/cards/:id', (req, res) => {
    const { id } = req.params;
    const updates = req.body;
    const index = serverCards.findIndex(c => c.id === id);

    if (index === -1) return res.status(404).json({ error: 'Card not found' });

    const serverItem = serverCards[index];


    if (updates.version !== undefined && updates.version !== serverItem.version) {
        return res.status(409).json({
            error: 'Conflict',
            serverItem: serverItem,
            message: 'Server has a newer version of this card.'
        });
    }

    serverCards[index] = {
        ...serverItem,
        ...updates,
        version: serverItem.version + 1,
        lastModifiedAt: Date.now()
    };
    res.json(serverCards[index]);
});

app.delete('/api/cards/:id', (req, res) => {
    const { id } = req.params;
    serverCards = serverCards.filter(c => c.id !== id);
    res.json({ success: true, id });
});


app.post('/api/reorder', (req, res) => {
    const { lists, cards } = req.body;

    if (lists) {
        lists.forEach(l => {
            const index = serverLists.findIndex(sl => sl.id === l.id);
            if (index !== -1) {

                serverLists[index].order = l.order;
                serverLists[index].version = (serverLists[index].version || 0) + 1;
                serverLists[index].lastModifiedAt = Date.now();
            }
        });
    }

    if (cards) {
        cards.forEach(c => {
            const index = serverCards.findIndex(sc => sc.id === c.id);
            if (index !== -1) {
                serverCards[index].order_id = c.order_id;
                serverCards[index].list_id = c.list_id;
                serverCards[index].version = (serverCards[index].version || 0) + 1;
                serverCards[index].lastModifiedAt = Date.now();
            }
        });
    }

    res.json({ success: true });
});


app.listen(3001, () => {
    console.log('Mock server running on http://localhost:3001');
});
