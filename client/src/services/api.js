// server/index.js
import express from 'express';
import cors from 'cors';

const app = express();
app.use(cors());
app.use(express.json());

// In-memory "database"
let serverLists = [];
let serverCards = [];

// Configuration for simulation
let CONFIG = {
    latency: 500, // ms
    failureRate: 0, // 0.0 to 1.0
};

// Middleware to simulate network conditions
const simulateNetwork = (req, res, next) => {
    setTimeout(() => {
        if (Math.random() < CONFIG.failureRate) {
            return res.status(500).json({ error: 'Simulated Network Failure' });
        }
        next();
    }, CONFIG.latency);
};

app.use(simulateNetwork);

// --- Config Endpoints ---
app.post('/api/config', (req, res) => {
    CONFIG = { ...CONFIG, ...req.body };
    res.json({ message: 'Config updated', config: CONFIG });
});

// --- Board Endpoints ---

// Get Full Board
app.get('/api/board', (req, res) => {
    // Return structured board data
    // Return lists sorted by order
    const lists = serverLists.sort((a, b) => a.order - b.order).map(list => {
        const cards = serverCards
            .filter(c => c.list_id === list.id)
            .sort((a, b) => a.order_id - b.order_id);
        return { ...list, cards };
    });
    res.json({ columns: lists });
});

// Reset Board (for testing)
app.post('/api/reset', (req, res) => {
    serverLists = [];
    serverCards = [];
    res.json({ message: 'Board reset' });
});

// --- List Endpoints ---

app.post('/api/lists', (req, res) => {
    const list = req.body;
    // validation
    if (!list.id || !list.title) return res.status(400).json({ error: 'Missing fields' });

    // Idempotency check
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
    const updates = req.body; // Expects { title, version, ... }
    const index = serverLists.findIndex(l => l.id === id);

    if (index === -1) return res.status(404).json({ error: 'List not found' });

    const serverItem = serverLists[index];

    // Optimistic Concurrency Check
    // If client sends a version, check it. If not sent, assume force update (or simplistic client).
    // For this assignment, strict check if version provided.
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
    // Usually DELETE might also need version check to ensure we aren't deleting something changed
    // But standard REST often just deletes. Let's support conflict check if body has version?
    // Delete in Express via query or body? Standard delete often no body.
    // Let's assume simpler delete for now or Check If-Match header ideally.
    // Given the prompt "If the server version is newer...", let's skip strict delete checks for now 
    // unless the user explicitly requested it for deletes too. The prompt said "updates".
    // Actually, "delete conflicts" are real. Let's leave simple delete for now to avoid overcomplicating.

    serverLists = serverLists.filter(l => l.id !== id);
    // Cascade delete cards
    serverCards = serverCards.filter(c => c.list_id !== id);
    res.json({ success: true, id });
});

// --- Card Endpoints ---

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

    // Optimistic Concurrency Check
    if (updates.version !== undefined && updates.version !== serverItem.version) {
        return res.status(409).json({
            error: 'Conflict',
            serverItem: serverItem, // Return current server state for merge
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

// --- Batch Reorder (Optional, but good for complex moves) ---
app.post('/api/reorder', (req, res) => {
    const { lists, cards } = req.body;

    if (lists) {
        lists.forEach(l => {
            const index = serverLists.findIndex(sl => sl.id === l.id);
            if (index !== -1) {
                // Should we update version? Yes.
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
