const express = require('express');
const cors = require('cors');
const app = express();
const PORT = process.env.PORT || 3000;

app.use(cors());
app.use(express.json());

// Mock Data
const users = [
    { id: 1, name: 'Alice' },
    { id: 2, name: 'Bob' },
];

// Routes
app.get('/api/users', (req, res) => {
    res.json(users);
});

app.get('/api/hello', (req, res) => {
    res.json({ message: 'Hello from Express Backend!' });
});

app.listen(PORT, () => {
    console.log(`Server running on http://localhost:${PORT}`);
});
