const express = require('express');
const path = require('path');
const fs = require('fs'); // Add this for file reading
const updatePlayerValues = require('./api/updatePlayerValues');

const app = express();
const port = process.env.PORT || 5500; // Use WHC's assigned port

// Middleware to parse JSON bodies
app.use(express.json());

// Serve static files from current directory
app.use(express.static(__dirname));

// ✅ New API endpoint to serve players.json from the backend
app.get('/api/players', (req, res) => {
    const filePath = path.join(__dirname, 'data', 'players.json');

    fs.readFile(filePath, 'utf8', (err, data) => {
        if (err) {
            console.error('Error reading players.json:', err);
            return res.status(500).json({ error: 'Failed to load player data' });
        }
        res.json(JSON.parse(data));
    });
});

// API endpoint for updating player values
app.post('/api/updatePlayerValues', async (req, res) => {
    try {
        const updates = req.body;
        console.log('Received update request:', updates);
        
        const result = await updatePlayerValues(updates);
        console.log('Update result:', result);
        
        res.json(result);
    } catch (error) {
        console.error('Server error:', error);
        res.status(500).json({
            success: false,
            error: error.message
        });
    }
});

// Error handling
app.use((err, req, res, next) => {
    console.error('Unhandled error:', err);
    res.status(500).json({
        success: false,
        error: 'Internal server error'
    });
});

// Start the server
app.listen(port, () => {
    console.log(`Server running at http://localhost:${port}`);
});