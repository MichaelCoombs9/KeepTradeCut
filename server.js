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

// Add this near the top with other imports and configurations
const submissionsPath = path.join(__dirname, 'data', 'submissions.json');

// Add this function to handle reading/writing submissions
async function getSubmissionsData() {
    const paths = [
        submissionsPath,
        './data/submissions.json',
        '../data/submissions.json',
        'submissions.json'
    ];

    for (const path of paths) {
        try {
            const data = await fs.readFile(path, 'utf8');
            return JSON.parse(data);
        } catch (e) {
            console.log(`Tried reading submissions from ${path}: ${e.message}`);
        }
    }

    // If no file found, return default structure
    return { total_submissions: 0, submissions: [] };
}

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

// Update the submissions endpoint
app.post('/api/submissions', async (req, res) => {
    try {
        // Get current submissions data
        let submissionsData = await getSubmissionsData();
        
        // Increment total and add new submission
        submissionsData.total_submissions++;
        submissionsData.submissions.push(req.body);

        // Try writing to multiple possible paths
        const paths = [
            submissionsPath,
            './data/submissions.json',
            '../data/submissions.json',
            'submissions.json'
        ];

        let saved = false;
        for (const path of paths) {
            try {
                await fs.writeFile(
                    path,
                    JSON.stringify(submissionsData, null, 2),
                    'utf8'
                );
                console.log(`Successfully saved submission to ${path}`);
                saved = true;
                break;
            } catch (e) {
                console.log(`Failed to save to ${path}: ${e.message}`);
            }
        }

        if (!saved) {
            throw new Error('Could not save submission to any path');
        }

        res.json({ 
            success: true, 
            total: submissionsData.total_submissions,
            message: 'Submission saved successfully'
        });
    } catch (error) {
        console.error('Error saving submission:', error);
        res.status(500).json({ 
            error: 'Failed to save submission',
            message: error.message 
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