const express = require('express');
const path = require('path');
// Use fs.promises for async/await file reads/writes
const fs = require('fs').promises;
const updatePlayerValues = require('./api/updatePlayerValues');

const app = express();
const port = process.env.PORT || 5500;

// Parse JSON bodies
app.use(express.json());

// Serve static files from the same folder as server.js
app.use(express.static(__dirname));

// Point directly to submissions.json inside nodeapp/data
const submissionsPath = path.join(__dirname, 'data', 'submissions.json');

/**
 * GET /api/players
 * Serves players.json from nodeapp/data
 */
app.get('/api/players', (req, res) => {
  const filePath = path.join(__dirname, 'data', 'players.json');
  fs.readFile(filePath, 'utf8')
    .then(data => res.json(JSON.parse(data)))
    .catch(err => {
      console.error('Error reading players.json:', err);
      res.status(500).json({ error: 'Failed to load player data' });
    });
});

/**
 * POST /api/updatePlayerValues
 * Updates players.json based on Elo logic
 */
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

/**
 * POST /api/submissions
 * Reads, updates, and writes to submissions.json in nodeapp/data
 */
app.post('/api/submissions', async (req, res) => {
  try {
    // 1. Read the existing submissions file
    const data = await fs.readFile(submissionsPath, 'utf8');
    let submissionsData = JSON.parse(data);

    // 2. Add the new submission
    submissionsData.total_submissions++;
    submissionsData.submissions.push(req.body);

    // 3. Write the updated data back to submissions.json
    await fs.writeFile(
      submissionsPath,
      JSON.stringify(submissionsData, null, 2),
      'utf8'
    );

    // 4. Send success
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

// Generic error handler
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