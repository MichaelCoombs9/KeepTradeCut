const fs = require('fs').promises;
const path = require('path');

async function updatePlayerValues(updates) {
    try {
        console.log('Received updates on server:', updates);

        // Read current players.json
        const playersPath = path.join(__dirname, '../data/players.json');
        console.log('Reading from:', playersPath);
        
        const playersData = await fs.readFile(playersPath, 'utf8');
        let players = JSON.parse(playersData);

        // Ensure all players have IDs
        players = players.map((player, index) => ({
            ...player,
            id: player.id !== undefined ? player.id : String(index)
        }));

        // Apply updates
        let updatedCount = 0;
        updates.forEach(update => {
            const player = players.find(p => p.id === update.id);
            if (player) {
                console.log(`Updating ${player.Name} (ID: ${player.id}) value from ${player.Value} to ${update.newValue}`);
                player.Value = update.newValue;
                updatedCount++;
            } else {
                console.log(`Could not find player with id ${update.id}`);
                // Try to find by name if provided
                if (update.name) {
                    const playerByName = players.find(p => p.Name === update.name);
                    if (playerByName) {
                        console.log(`Found player by name instead: ${playerByName.Name} (ID: ${playerByName.id})`);
                        playerByName.Value = update.newValue;
                        updatedCount++;
                    }
                }
            }
        });

        // Write updated data back to file
        if (updatedCount > 0) {
            await fs.writeFile(playersPath, JSON.stringify(players, null, 2));
            console.log(`Successfully updated ${updatedCount} players`);
        }

        return {
            success: true,
            updatedCount,
            message: `Successfully updated ${updatedCount} players`
        };
    } catch (error) {
        console.error('Error updating players.json:', error);
        return {
            success: false,
            error: error.message
        };
    }
}

module.exports = updatePlayerValues; 