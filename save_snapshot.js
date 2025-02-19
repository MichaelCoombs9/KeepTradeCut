const fs = require('fs').promises;
const path = require('path');

const SNAPSHOT_DIR = path.join(__dirname, 'data', 'snapshots');
const PLAYERS_FILE = path.join(__dirname, 'data', 'players.json');

async function saveDailySnapshot() {
    try {
        const today = new Date().toISOString().split('T')[0]; // Format: YYYY-MM-DD
        const snapshotPath = path.join(SNAPSHOT_DIR, `${today}.json`);

        // Ensure the snapshots directory exists
        await fs.mkdir(SNAPSHOT_DIR, { recursive: true });

        // Read the current players.json and save as a snapshot
        const data = await fs.readFile(PLAYERS_FILE, 'utf8');
        await fs.writeFile(snapshotPath, data);

        console.log(`✅ Snapshot saved for ${today}`);
    } catch (error) {
        console.error('❌ Error saving snapshot:', error);
    }
}

// Run function when the script is executed
saveDailySnapshot();
