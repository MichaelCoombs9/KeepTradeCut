let ALL_PLAYERS = [];

// Track votes
const votes = new Map();

// Load players function from app.js
async function loadPlayers() {
    try {
        const paths = ['/data/players.json', './data/players.json', '../data/players.json', 'players.json'];
        
        let response;
        for (const path of paths) {
            try {
                response = await fetch(path);
                if (response.ok) break;
            } catch (e) {
                console.log(`Tried path ${path}: ${e.message}`);
            }
        }

        if (!response || !response.ok) {
            throw new Error('Could not load players data');
        }

        let players = await response.json();
        
        ALL_PLAYERS = players.map((player, index) => ({
            ...player,
            Number: player.Number || String(index + 1),
            Hand: player.Hand || '-',
            Age: player.Age || '??',
            Team: player.Team || 'FA',
            Position: player.Position || 'Unknown',
            Headshot: player.Headshot || 'https://img.mlbstatic.com/mlb-photos/image/upload/w_213,d_people:generic:headshot:silo:current.png,q_auto:best,f_auto/v1/people/generic/headshot/67/current',
            id: index.toString(),
            value: player.Value,
            trend: player.Value > 9000 ? 'up' : player.Value < 5000 ? 'down' : 'stable'
        }));

        return true;
    } catch (error) {
        console.error('Error loading players:', error);
        return false;
    }
}

// Get random players function from app.js
async function getRandomPlayers(count = 3) {
    return new Promise(resolve => {
        const shuffled = [...ALL_PLAYERS].sort(() => 0.5 - Math.random());
        resolve(shuffled.slice(0, count));
    });
}

// Elo calculation functions from app.js
const K_FACTOR = 32;
const ELO_SCALE = 400;

function calculateExpectedScore(valueA, valueB) {
    return 1 / (1 + Math.pow(10, (valueB - valueA) / ELO_SCALE));
}

function calculateNewValue(oldValue, expectedScore, actualScore) {
    return Math.round(oldValue + K_FACTOR * (actualScore - expectedScore));
}

// Save submission function using /api/submissions endpoint
async function saveSubmission(players, votes) {
    try {
        console.log('Players:', players);
        console.log('Votes:', votes);
        // Map votes to player names, normalizing vote case
        const votedPlayers = Array.from(votes.entries()).map(([id, vote]) => {
            const player = players.find(p => p.id === id);
            return {
                id: id,
                name: player.Name,
                vote: vote.toLowerCase()
            };
        });
        console.log('Mapped voted players:', votedPlayers);
        const timestamp = new Date().toISOString();
        const submission = {
            timestamp,
            player_1: players[0].Name,
            player_2: players[1].Name,
            player_3: players[2].Name,
            keep: votedPlayers.find(p => p.vote === 'start')?.name,
            trade: votedPlayers.find(p => p.vote === 'bench')?.name,
            cut: votedPlayers.find(p => p.vote === 'cut')?.name
        };
        console.log('Created submission:', submission);
        if (!submission.player_1 || !submission.player_2 || !submission.player_3 ||
            !submission.keep || !submission.trade || !submission.cut) {
            console.error('Missing data in submission:', submission);
            throw new Error('Missing player data in submission');
        }
        const response = await fetch('/api/submissions', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(submission)
        });
        if (response.ok) {
            console.log('Submission saved successfully.');
            return true;
        } else {
            console.error(`Failed to save submission. Status: ${response.status}`);
            return false;
        }
    } catch (error) {
        console.error('Error saving submission:', error);
        return false;
    }
}

// Load players and initialize the page
async function initialize() {
    const loaded = await loadPlayers();
    if (!loaded) {
        console.error('Failed to load players');
        return;
    }
    await loadNewPlayers();
}

// Load new set of players
async function loadNewPlayers() {
    // Clear existing votes
    votes.clear();
    
    // Get new random players
    const players = await getRandomPlayers(3);
    
    // Update UI
    const container = document.getElementById('playerCards');
    container.innerHTML = players.map(player => createPlayerCard(player)).join('');
    
    // Reset submit button state
    updateSubmitButton();
}

// Create player card HTML
function createPlayerCard(player) {
    return `
        <div class="border rounded-lg p-3 bg-gray-50" data-player-id="${player.id}">
            <!-- Mobile Layout (horizontal) -->
            <div class="sm:hidden">
                <div class="flex items-center">
                    <img src="${player.Headshot}" alt="${player.Name}" 
                         class="w-14 h-14 rounded-full object-cover border-4 border-white shadow-lg">
                    <div class="ml-3 flex-1">
                        <h3 class="text-lg font-bold text-gray-900">${player.Name}</h3>
                        <p class="text-gray-500 text-sm">${player.Team} • ${player.Position} • ${player.Age} y/o</p>
                    </div>
                </div>
                <div class="grid grid-cols-3 gap-2 mt-3">
                    <button onclick="handleVote('${player.id}', 'Start')" 
                            class="py-2 bg-[#98e5a7] rounded-lg transition-all duration-300 
                                   transform hover:-translate-y-[2px] hover:shadow-lg text-sm font-medium">
                        Start
                    </button>
                    <button onclick="handleVote('${player.id}', 'Bench')" 
                            class="py-2 bg-[#f3d676] rounded-lg transition-all duration-300
                                   transform hover:-translate-y-[2px] hover:shadow-lg text-sm font-medium">
                        Bench
                    </button>
                    <button onclick="handleVote('${player.id}', 'Cut')" 
                            class="py-2 bg-[#f1a7a7] rounded-lg transition-all duration-300
                                   transform hover:-translate-y-[2px] hover:shadow-lg text-sm font-medium">
                        Cut
                    </button>
                </div>
            </div>

            <!-- Desktop Layout (vertical) -->
            <div class="hidden sm:block">
                <div class="text-center">
                    <img src="${player.Headshot}" alt="${player.Name}" 
                         class="w-20 h-20 mx-auto rounded-full object-cover border-4 border-white shadow-lg
                                transform transition-transform duration-500 hover:scale-105">
                    <div class="mt-2">
                        <h3 class="text-lg font-bold text-gray-900 leading-tight">${player.Name}</h3>
                        <p class="text-gray-500 text-sm">${player.Team} • ${player.Position}</p>
                        <p class="text-gray-400 text-sm mb-2">${player.Age} y/o</p>
                    </div>
                </div>
                <div class="flex flex-col gap-2">
                    <button onclick="handleVote('${player.id}', 'Start')" 
                            class="py-2 bg-[#98e5a7] rounded-lg transition-all duration-300 
                                   transform hover:-translate-y-[2px] hover:shadow-lg text-sm font-medium">
                        Start
                    </button>
                    <button onclick="handleVote('${player.id}', 'Bench')" 
                            class="py-2 bg-[#f3d676] rounded-lg transition-all duration-300
                                   transform hover:-translate-y-[2px] hover:shadow-lg text-sm font-medium">
                        Bench
                    </button>
                    <button onclick="handleVote('${player.id}', 'Cut')" 
                            class="py-2 bg-[#f1a7a7] rounded-lg transition-all duration-300
                                   transform hover:-translate-y-[2px] hover:shadow-lg text-sm font-medium">
                        Cut
                    </button>
                </div>
            </div>
        </div>
    `;
}

// Handle vote button clicks
function handleVote(playerId, vote) {
    // Remove any existing votes for this player
    for (let [pid, v] of votes.entries()) {
        if (v === vote) {
            votes.delete(pid);
        }
    }
    
    votes.set(playerId, vote);
    
    // Update UI
    updateVoteUI();
    updateSubmitButton();
}

// Update the UI to reflect current votes
function updateVoteUI() {
    document.querySelectorAll('[data-player-id]').forEach(card => {
        const playerId = card.dataset.playerId;
        const currentVote = votes.get(playerId);
        
        // Reset all buttons
        card.querySelectorAll('button').forEach(button => {
            const action = button.textContent.trim().toLowerCase();
            button.classList.remove('ring-2', 'ring-offset-2', 'ring-blue-500');
            
            if (currentVote && currentVote.toLowerCase() === action) {
                button.classList.add('ring-2', 'ring-offset-2', 'ring-blue-500');
            }
        });
    });
}

// Update submit button state
function updateSubmitButton() {
    const submitBtn = document.getElementById('submit-votes');
    const isComplete = votes.size === 3 && 
                      new Set(votes.values()).size === 3;
    
    submitBtn.disabled = !isComplete;
}

// Event Listeners
document.addEventListener('DOMContentLoaded', initialize);

document.getElementById('submit-votes').addEventListener('click', async () => {
    if (votes.size === 3) {
        // Get voted players with their votes
        const votedPlayers = Array.from(votes.entries()).map(([playerId, vote]) => {
            const player = ALL_PLAYERS.find(p => p.id === playerId);
            return { ...player, vote };
        });

        // Save submission before updating values
        await saveSubmission(votedPlayers, votes);

        // Update player values
        await updatePlayerValues(votedPlayers);

        // Load new set of players
        await loadNewPlayers();
    }
});

document.getElementById('skip-players').addEventListener('click', loadNewPlayers);

// Update player values function (original implementation)
async function updatePlayerValues(votedPlayers) {
    console.log('Starting vote processing for players:', votedPlayers);

    // Sort players by their vote (Start > Bench > Cut)
    const sortedPlayers = [...votedPlayers].sort((a, b) => {
        const voteOrder = { 'start': 2, 'bench': 1, 'cut': 0 };
        return voteOrder[b.vote.toLowerCase()] - voteOrder[a.vote.toLowerCase()];
    });

    // Process each matchup and store final values
    const finalValues = new Map();
    
    // Process matchups in order: Start vs Bench, Start vs Cut, Bench vs Cut
    for (let i = 0; i < sortedPlayers.length - 1; i++) {
        const playerA = sortedPlayers[i];
        const playerB = sortedPlayers[i + 1];

        console.log(`\nProcessing matchup: ${playerA.Name} (${playerA.vote}) vs ${playerB.Name} (${playerB.vote})`);
        console.log(`Current values - ${playerA.Name}: ${playerA.Value}, ${playerB.Name}: ${playerB.Value}`);

        // Calculate expected scores
        const expectedA = calculateExpectedScore(playerA.Value, playerB.Value);
        const expectedB = calculateExpectedScore(playerB.Value, playerA.Value);
        console.log(`Expected scores - ${playerA.Name}: ${expectedA.toFixed(3)}, ${playerB.Name}: ${expectedB.toFixed(3)}`);

        // Higher vote always wins (Start beats Bench, Bench beats Cut)
        const newValueA = calculateNewValue(playerA.Value, expectedA, 1);
        const newValueB = calculateNewValue(playerB.Value, expectedB, 0);
        console.log(`New values - ${playerA.Name}: ${newValueA}, ${playerB.Name}: ${newValueB}`);

        // Store the values
        finalValues.set(playerA.id, {
            id: playerA.id,
            name: playerA.Name,
            oldValue: playerA.Value,
            newValue: newValueA
        });
        
        finalValues.set(playerB.id, {
            id: playerB.id,
            name: playerB.Name,
            oldValue: playerB.Value,
            newValue: newValueB
        });
    }

    // Convert final values to updates array
    const updates = Array.from(finalValues.values());
    console.log('\nFinal updates to be applied:', updates);

    try {
        // Update local data
        updates.forEach(update => {
            const player = ALL_PLAYERS.find(p => p.id === update.id);
            if (player) {
                console.log(`Updating local player ${update.name} (ID: ${update.id}) value from ${update.oldValue} to ${update.newValue}`);
                player.Value = update.newValue;
            }
        });

        // Send updates to server
        console.log('Sending updates to server...');
        const response = await fetch('/api/updatePlayerValues', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify(updates)
        });

        if (!response.ok) {
            throw new Error(`Server responded with status: ${response.status}`);
        }

        const responseData = await response.json();
        console.log('Server response:', responseData);

    } catch (error) {
        console.error('Error updating player values:', error);
    }
}

// Add at the end of the file: Social menu initialization
function initializeSocialMenu() {
    const hamburgerButton = document.querySelector('.hamburger-button');
    const socialMenu = document.querySelector('.social-menu');
    
    if (hamburgerButton && socialMenu) {
        hamburgerButton.addEventListener('click', (e) => {
            e.stopPropagation();
            socialMenu.classList.toggle('translate-x-full');
            socialMenu.classList.toggle('translate-x-0');
            hamburgerButton.classList.toggle('open');
        });

        document.addEventListener('click', (e) => {
            if (!socialMenu.contains(e.target) && !hamburgerButton.contains(e.target)) {
                socialMenu.classList.add('translate-x-full');
                socialMenu.classList.remove('translate-x-0');
                hamburgerButton.classList.remove('open');
            }
        });
    }
}

// Add social menu initialization after DOM content is loaded
document.addEventListener('DOMContentLoaded', () => {
    initializeSocialMenu();
});