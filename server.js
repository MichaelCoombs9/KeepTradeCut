const express = require('express');
const path = require('path');
const updatePlayerValues = require('./api/updatePlayerValues');

const app = express();
const port = 5500;

// Middleware to parse JSON bodies
app.use(express.json());

// Serve static files from current directory
app.use(express.static(__dirname));

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

app.listen(port, () => {
    console.log(`Server running at http://localhost:${port}`);
}); 