// Replace the placeholder data with fetch from JSON
let ALL_PLAYERS = [];

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
        
        // Add missing fields and clean up data, preserving existing IDs
        ALL_PLAYERS = players.map((player, index) => ({
            ...player,
            Number: player.Number || String(index + 1),
            Hand: player.Hand || '-',
            Age: player.Age || '??',
            Team: player.Team || 'FA',
            Position: player.Position || 'Unknown',
            Headshot: player.Headshot || 'https://img.mlbstatic.com/mlb-photos/image/upload/w_213,d_people:generic:headshot:silo:current.png,q_auto:best,f_auto/v1/people/generic/headshot/67/current',
            id: index.toString(), // Use array index as string ID
            value: player.Value,
            trend: player.Value > 9000 ? 'up' : player.Value < 5000 ? 'down' : 'stable'
        }));

        // Log first few players to verify ID assignment
        console.log('First few players loaded:', ALL_PLAYERS.slice(0, 3).map(p => ({
            id: p.id,
            name: p.Name,
            value: p.Value
        })));

        return true;
    } catch (error) {
        console.error('Error loading players:', error);
        return false;
    }
}

// Update getRandomPlayers to use the new data
async function getRandomPlayers(count = 3) {
    return new Promise(resolve => {
        const shuffled = [...ALL_PLAYERS].sort(() => 0.5 - Math.random());
        resolve(shuffled.slice(0, count));
    });
}

// Update the player card creation to use the new data structure
function createPlayerCard(player, index) {
    // At the start of the function, log the player data
    console.log('Creating card for player:', {
        id: player.id,
        name: player.Name,
        value: player.Value
    });

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
                    <button onclick="handleVote(${player.id}, 'Start')" 
                            class="py-2 bg-[#98e5a7] rounded-lg transition-all duration-300 
                                   transform hover:-translate-y-[2px] hover:shadow-lg text-sm font-medium">
                        Start
                    </button>
                    <button onclick="handleVote(${player.id}, 'Bench')" 
                            class="py-2 bg-[#f3d676] rounded-lg transition-all duration-300
                                   transform hover:-translate-y-[2px] hover:shadow-lg text-sm font-medium">
                        Bench
                    </button>
                    <button onclick="handleVote(${player.id}, 'cut')" 
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
                    <button onclick="handleVote(${player.id}, 'Start')" 
                            class="py-2 bg-[#98e5a7] rounded-lg transition-all duration-300 
                                   transform hover:-translate-y-[2px] hover:shadow-lg text-sm font-medium">
                        Start
                    </button>
                    <button onclick="handleVote(${player.id}, 'Bench')" 
                            class="py-2 bg-[#f3d676] rounded-lg transition-all duration-300
                                   transform hover:-translate-y-[2px] hover:shadow-lg text-sm font-medium">
                        Bench
                    </button>
                    <button onclick="handleVote(${player.id}, 'cut')" 
                            class="py-2 bg-[#f1a7a7] rounded-lg transition-all duration-300
                                   transform hover:-translate-y-[2px] hover:shadow-lg text-sm font-medium">
                        Cut
                    </button>
                </div>
            </div>
        </div>
    `;
}

// Track votes
const votes = new Map();

function handleVote(playerId, vote) {
    // Convert playerId to string if it isn't already
    playerId = playerId.toString();
    
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

function updateVoteUI() {
    document.querySelectorAll('[data-player-id]').forEach(card => {
        const playerId = card.dataset.playerId;
        const currentVote = votes.get(playerId); // Remove parseInt
        
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

function updateSubmitButton() {
    const submitBtn = document.getElementById('submit-ktc');
    const isComplete = votes.size === 3 && 
                      new Set(votes.values()).size === 3;
    
    submitBtn.disabled = !isComplete;
}

async function showKTCModal() {
    const modal = createKTCModal();
    document.body.appendChild(modal);
    
    const players = await getRandomPlayers();
    const container = document.getElementById('playerCards');
    container.innerHTML = players.map((player, index) => createPlayerCard(player, index)).join('');

    // Handle submit
    document.getElementById('submit-ktc').addEventListener('click', async () => {
        if (votes.size === 3) {
            // Get voted players with their votes
            const votedPlayers = Array.from(votes.entries()).map(([playerId, vote]) => {
                const player = ALL_PLAYERS.find(p => p.id === String(playerId));
                return { ...player, vote };
            });

            // Update player values using Elo system
            await updatePlayerValues(votedPlayers);

            modal.remove();
        }
    });

    // Handle skip
    document.getElementById('skip-players').addEventListener('click', () => {
        modal.remove();
        showKTCModal(); // Show new players
    });
}

// Make handleVote available globally
window.handleVote = handleVote;

function initializeSearchBoxes() {
    const searchInputs = document.querySelectorAll('.player-search');
    
    searchInputs.forEach(input => {
        const dropdownContainer = document.createElement('div');
        dropdownContainer.className = 'absolute w-full bg-white mt-1 rounded-lg shadow-lg border border-gray-200 z-50 hidden';
        input.parentElement.appendChild(dropdownContainer);

        input.addEventListener('input', debounce((e) => {
            const searchTerm = e.target.value.toLowerCase();
            if (searchTerm.length < 2) {
                dropdownContainer.classList.add('hidden');
                return;
            }

            const matches = ALL_PLAYERS.filter(player => 
                player.Name.toLowerCase().includes(searchTerm) ||
                player.Team.toLowerCase().includes(searchTerm)
            ).slice(0, 5);

            if (matches.length > 0) {
                dropdownContainer.innerHTML = matches.map(player => `
                    <div class="player-option p-3 hover:bg-gray-50 cursor-pointer flex items-center justify-between group"
                         data-player-id="${player.Number}">
                        <div class="flex items-center gap-3">
                            <img src="${player.Headshot}" class="rounded-full w-10 h-10 object-cover">
                            <div>
                                <div class="font-medium text-gray-900">${player.Name}</div>
                                <div class="text-sm text-gray-500">${player.Team} • ${player.Position}</div>
                            </div>
                        </div>
                        <div class="text-sm font-medium ${player.trend === 'up' ? 'text-green-600' : player.trend === 'down' ? 'text-red-600' : 'text-gray-600'}">
                            ${player.Value}
                            ${player.trend === 'up' ? '↑' : player.trend === 'down' ? '↓' : ''}
                        </div>
                    </div>
                `).join('');
                dropdownContainer.classList.remove('hidden');
            } else {
                dropdownContainer.innerHTML = `
                    <div class="p-3 text-gray-500 text-center">No players found</div>
                `;
                dropdownContainer.classList.remove('hidden');
            }
        }, 200));

        // Handle click outside
        document.addEventListener('click', (e) => {
            if (!input.contains(e.target) && !dropdownContainer.contains(e.target)) {
                dropdownContainer.classList.add('hidden');
            }
        });

        // Handle player selection - Updated this part
        dropdownContainer.addEventListener('click', (e) => {
            const playerOption = e.target.closest('.player-option');
            if (playerOption) {
                const playerId = playerOption.dataset.playerId;
                const player = ALL_PLAYERS.find(p => p.Number === playerId);
                if (player) {
                    addPlayerToTeam(player, input.closest('.team-section').dataset.team);
                    input.value = '';
                    dropdownContainer.classList.add('hidden');
                }
            }
        });
    });
}

function addPlayerToTeam(player, teamNumber) {
    console.log('Adding player to team:', {
        player,
        teamNumber,
        playerValue: player.Value
    });

    const teamContainer = document.querySelector(`[data-team="${teamNumber}"] .selected-players`);
    const searchInput = document.querySelector(`[data-team="${teamNumber}"] .player-search`);
    const suggestions = searchInput.parentNode.querySelector('.suggestions');
    
    const playerElement = document.createElement('div');
    playerElement.className = 'flex items-center justify-between p-3 bg-white rounded-lg border border-gray-200 shadow-sm';
    playerElement.dataset.playerId = player.id; // Store the player ID
    playerElement.innerHTML = `
        <div class="flex items-center gap-3">
            <img src="${player.Headshot}" class="rounded-full w-10 h-10 object-cover">
            <div>
                <div class="font-medium text-gray-900">${player.Name}</div>
                <div class="text-sm text-gray-500">${player.Team} • ${player.Position}</div>
            </div>
        </div>
        <div class="flex items-center gap-3">
            <div class="text-sm font-medium ${player.trend === 'up' ? 'text-green-600' : player.trend === 'down' ? 'text-red-600' : 'text-gray-600'}">
                ${player.Value}
                ${player.trend === 'up' ? '↑' : player.trend === 'down' ? '↓' : ''}
            </div>
            <button class="text-gray-400 hover:text-red-500" onclick="removePlayer(this, '${teamNumber}')">×</button>
        </div>
    `;
    
    teamContainer.appendChild(playerElement);
    searchInput.value = '';
    suggestions.innerHTML = '';
    
    // Update both pieces and values
    updateTotalPieces(teamNumber);
    updateTradeValues();
}

function updateTotalPieces(teamNumber) {
    const players = Array.from(document.querySelector(`[data-team="${teamNumber}"] .selected-players`).children);
    const count = players.length;
    
    const totalPiecesEl = document.querySelector(`.total-pieces-${teamNumber}`);
    const breakdownEl = document.querySelector(`.pieces-breakdown-${teamNumber}`);
    
    if (count === 0) {
        totalPiecesEl.style.display = 'none';
        breakdownEl.style.display = 'none';
        return;
    }

    // Show and update the elements
    totalPiecesEl.style.display = 'block';
    breakdownEl.style.display = 'block';
    
    // Update total pieces count
    totalPiecesEl.textContent = `${count} Total Pieces`;
    
    // Get positions for breakdown
    const positions = players.map(el => {
        const positionText = el.querySelector('.text-gray-500').textContent;
        return positionText.split('•')[1].trim();
    });
    
    // Create position breakdown text
    breakdownEl.textContent = positions.join(', ');
}

// Utility function for debouncing
function debounce(func, wait) {
    let timeout;
    return function executedFunction(...args) {
        const later = () => {
            clearTimeout(timeout);
            func(...args);
        };
        clearTimeout(timeout);
        timeout = setTimeout(later, wait);
    };
}

// Update initialization
document.addEventListener('DOMContentLoaded', async () => {
    // Load players first
    const loaded = await loadPlayers();
    if (!loaded) {
        console.error('Failed to load players');
        return;
    }
    console.log('Players loaded:', ALL_PLAYERS.length);

    // Initialize search for both team sections
    document.querySelectorAll('.team-section').forEach(container => {
        setupPlayerSearch(container);
    });

    showKTCModal();
    initializeSearchBoxes();
});

// Add this function back
function createKTCModal() {
    const modal = document.createElement('div');
    modal.className = 'fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4';
    modal.id = 'ktc-modal';
    
    modal.innerHTML = `
        <div class="bg-white rounded-xl shadow-xl w-full max-w-4xl mx-auto">
            <div class="p-4 sm:p-6">
                <div class="max-w-2xl mx-auto">
                    <h2 class="text-xl sm:text-2xl font-bold text-center mb-2">Your Thoughts?</h2>
                    <p class="text-center text-gray-600 text-sm mb-1">
                        KTC's values are crowdsourced from users like you.
                    </p>
                    <p class="text-center text-gray-600 text-sm mb-3">
                        <span class="font-medium">Start</span> the most valuable, 
                        <span class="font-medium">Bench</span> the second in value, and 
                        <span class="font-medium">Cut</span> the least valuable.
                    </p>
                    
                    <div class="grid grid-cols-1 sm:grid-cols-3 gap-3" id="playerCards">
                        <!-- Player cards will be inserted here -->
                    </div>

                    <div class="mt-3 text-center">
                        <button id="submit-ktc" 
                                class="w-full max-w-md bg-blue-600 text-white px-8 py-2 rounded-lg 
                                       hover:bg-blue-700 transition-all disabled:opacity-50 disabled:cursor-not-allowed">
                            Submit for Dynasty Baseball
                        </button>
                        <p class="mt-1 text-sm text-blue-600 hover:underline cursor-pointer" id="skip-players">
                            I don't know all of these players
                        </p>
                    </div>
                </div>
            </div>
        </div>
    `;

    return modal;
}

// Add Elo rating constants
const K_FACTOR = 32; // Standard K-factor, can be adjusted
const ELO_SCALE = 400; // Standard Elo scale divisor

// Calculate expected score using Elo formula
function calculateExpectedScore(valueA, valueB) {
    return 1 / (1 + Math.pow(10, (valueB - valueA) / ELO_SCALE));
}

// Calculate new value based on Elo formula
function calculateNewValue(oldValue, expectedScore, actualScore) {
    return Math.round(oldValue + K_FACTOR * (actualScore - expectedScore));
}

// Update player values based on Start/Bench/Cut voting
async function updatePlayerValues(votedPlayers) {
    console.log('Starting vote processing for players:', votedPlayers);

    // Sort players by their vote (Start > Bench > Cut)
    const sortedPlayers = [...votedPlayers].sort((a, b) => {
        const voteOrder = { 'start': 2, 'bench': 1, 'cut': 0 };
        return voteOrder[b.vote.toLowerCase()] - voteOrder[a.vote.toLowerCase()];
    });

    // Process each matchup and store final values
    const finalValues = new Map(); // Store the final value for each player
    
    for (let i = 0; i < sortedPlayers.length; i++) {
        for (let j = i + 1; j < sortedPlayers.length; j++) {
            const playerA = sortedPlayers[i];
            const playerB = sortedPlayers[j];

            console.log(`\nProcessing matchup: ${playerA.Name} (${playerA.vote}) vs ${playerB.Name} (${playerB.vote})`);
            console.log(`Current values - ${playerA.Name}: ${playerA.Value}, ${playerB.Name}: ${playerB.Value}`);

            // Calculate expected scores
            const expectedA = calculateExpectedScore(playerA.Value, playerB.Value);
            const expectedB = calculateExpectedScore(playerB.Value, playerA.Value);
            console.log(`Expected scores - ${playerA.Name}: ${expectedA.toFixed(3)}, ${playerB.Name}: ${expectedB.toFixed(3)}`);

            // Calculate new values
            const newValueA = calculateNewValue(playerA.Value, expectedA, 1);
            const newValueB = calculateNewValue(playerB.Value, expectedB, 0);
            console.log(`New values - ${playerA.Name}: ${newValueA}, ${playerB.Name}: ${newValueB}`);

            // Store the most recent value for each player
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
    }

    // Convert final values to updates array
    const updates = Array.from(finalValues.values());
    console.log('\nFinal updates to be applied:', updates);

    // Apply updates to players.json
    try {
        // Update local data
        updates.forEach(update => {
            const player = ALL_PLAYERS.find(p => p.id === update.id || p.Name === update.name);
            if (player) {
                console.log(`Updating local player ${update.name} (ID: ${update.id}) value from ${update.oldValue} to ${update.newValue}`);
                player.Value = update.newValue;
            } else {
                console.log(`Could not find player with id ${update.id} or name ${update.name}`);
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

// async function mergeRankingsIntoPlayers() {
//     try {
//         // Load both JSON files
//         const playersResponse = await fetch('./data/players.json');
//         const rankingsResponse = await fetch('./data/rankings.json');
        
//         const players = await playersResponse.json();
//         const rankings = await rankingsResponse.json();

//         // Create a map of player names to their rankings
//         const rankingsMap = new Map(
//             rankings.map(rank => [rank['PLAYER NAME'].toLowerCase(), rank['RK']])
//         );

//         // Add rankings to players
//         const updatedPlayers = players.map(player => ({
//             ...player,
//             Rank: rankingsMap.get(player.Name.toLowerCase()) || null
//         }));

//         // Log stats
//         const rankedPlayers = updatedPlayers.filter(p => p.Rank !== null);
//         console.log(`Successfully ranked ${rankedPlayers.length} out of ${players.length} players`);

//         // Sort by rank (null ranks at the end)
//         const sortedPlayers = updatedPlayers.sort((a, b) => {
//             if (a.Rank === null && b.Rank === null) return 0;
//             if (a.Rank === null) return 1;
//             if (b.Rank === null) return -1;
//             return parseInt(a.Rank) - parseInt(b.Rank);
//         });

//         return sortedPlayers;

//     } catch (error) {
//         console.error('Error merging rankings:', error);
//         return null;
//     }
// }

// // Add this function to save the merged data
// async function saveMergedPlayers() {
//     const mergedPlayers = await mergeRankingsIntoPlayers();
//     if (!mergedPlayers) {
//         console.error('Failed to merge players');
//         return;
//     }

//     // Log some sample data to verify
//     console.log('First 5 ranked players:', mergedPlayers.slice(0, 5));
//     console.log('Last 5 ranked players:', mergedPlayers.slice(-5));

//     // In a real environment, you would save this to a file
//     // For now, we'll log it to console in a format you can copy
//     console.log(JSON.stringify(mergedPlayers, null, 2));
// }

// // Run it
// saveMergedPlayers(); 

// Update the search functionality to be more precise
function setupPlayerSearch(container) {
    const searchInput = container.querySelector('.player-search');
    const suggestions = document.createElement('div');
    suggestions.className = 'absolute z-10 w-full bg-white border rounded-lg shadow-lg mt-1 suggestions';
    searchInput.parentNode.appendChild(suggestions);
    
    // Create a function to clear the search
    const clearSearch = () => {
        searchInput.value = '';
        suggestions.innerHTML = '';
    };

    suggestions.addEventListener('click', function(e) {
        const clickedOption = e.target.closest('.player-option');
        if (!clickedOption) return;

        const clickedId = clickedOption.dataset.playerId;
        const selectedPlayer = ALL_PLAYERS.find(p => p.id === clickedId);
        
        if (selectedPlayer) {
            // Clear before adding player
            clearSearch();
            
            // Add player to team
            const teamNumber = container.dataset.team;
            const teamContainer = document.querySelector(`[data-team="${teamNumber}"] .selected-players`);
            
            const playerElement = document.createElement('div');
            playerElement.className = 'flex items-center justify-between p-3 bg-white rounded-lg border border-gray-200 shadow-sm';
            playerElement.dataset.playerId = selectedPlayer.id; // Store the player ID
            playerElement.innerHTML = `
                <div class="flex items-center gap-3">
                    <img src="${selectedPlayer.Headshot}" class="rounded-full w-10 h-10 object-cover">
                    <div>
                        <div class="font-medium text-gray-900">${selectedPlayer.Name}</div>
                        <div class="text-sm text-gray-500">${selectedPlayer.Team} • ${selectedPlayer.Position}</div>
                    </div>
                </div>
                <div class="flex items-center gap-3">
                    <div class="text-sm font-medium ${selectedPlayer.trend === 'up' ? 'text-green-600' : selectedPlayer.trend === 'down' ? 'text-red-600' : 'text-gray-600'}">
                        ${selectedPlayer.Value}
                        ${selectedPlayer.trend === 'up' ? '↑' : selectedPlayer.trend === 'down' ? '↓' : ''}
                    </div>
                    <button class="text-gray-400 hover:text-red-500" onclick="removePlayer(this, '${teamNumber}')">×</button>
                </div>
            `;
            
            teamContainer.appendChild(playerElement);
            
            // Update after player is added
            updateTotalPieces(teamNumber);
            updateTradeValues();
        }
    });

    // Also clear search when clicking outside
    document.addEventListener('click', (e) => {
        if (!searchInput.contains(e.target) && !suggestions.contains(e.target)) {
            clearSearch();
        }
    });

    searchInput.addEventListener('input', (e) => {
        const searchTerm = e.target.value.toLowerCase().trim();
        
        if (searchTerm.length < 2) {
            suggestions.innerHTML = '';
            return;
        }

        const matches = ALL_PLAYERS.filter(player => {
            const playerName = player.Name.toLowerCase();
            const playerNameWords = playerName.split(' ');
            
            if (playerName === searchTerm) return true;
            if (playerNameWords.some(word => word.startsWith(searchTerm))) return true;
            if (playerName.startsWith(searchTerm)) return true;
            if (searchTerm.length >= 3 && playerName.includes(searchTerm)) return true;
            
            return false;
        }).slice(0, 5);

        console.log('Search matches with full details:', matches.map(p => ({
            id: p.id,
            name: p.Name,
            position: p.Position,
            team: p.Team,
            value: p.Value
        })));

        suggestions.innerHTML = matches.map(player => `
            <div class="player-option p-3 hover:bg-gray-50 cursor-pointer flex items-center justify-between group" 
                 data-player-id="${player.id}">
                <div class="flex items-center gap-3">
                    <img src="${player.Headshot}" 
                         class="rounded-full w-10 h-10 object-cover"
                         alt="${player.Name}">
                    <div>
                        <div class="font-medium text-gray-900">${player.Name}</div>
                        <div class="text-sm text-gray-500">${player.Team} • ${player.Position}</div>
                    </div>
                </div>
                <div class="text-sm font-medium ${player.trend === 'up' ? 'text-green-600' : player.trend === 'down' ? 'text-red-600' : 'text-gray-600'}">
                    ${player.Value}
                    ${player.trend === 'up' ? '↑' : player.trend === 'down' ? '↓' : ''}
                </div>
            </div>
        `).join('');
    });
}

// Add these functions near the top of the file
function calculateRawAdjustment(playerValue, topValue, maxValue) {
    // Similar to the Python example but tweaked for our scale
    return playerValue * (
        0.1 + 
        0.2 * Math.pow(playerValue / maxValue, 8) + 
        0.1 * Math.pow(playerValue / topValue, 1.3) + 
        0.1 * Math.pow(playerValue / (maxValue + 2000), 1.28)
    );
}

function calculateTeamAdjustment(players) {
    if (!players.length) return 0;
    
    // Find the highest value player in the trade
    const allValues = players.map(p => parseInt(p.Value));
    const topValue = Math.max(...allValues);
    
    // Use the highest value in our dataset as maxValue
    const maxValue = Math.max(...ALL_PLAYERS.map(p => parseInt(p.Value)));
    
    // Calculate total adjustment
    return players.reduce((total, player) => {
        return total + calculateRawAdjustment(
            parseInt(player.Value), 
            topValue, 
            maxValue
        );
    }, 0);
}

function updateTradeValues() {
    // Get all required elements first and check if they exist
    const elements = {
        tradeBar: document.querySelector('.trade-bar'),
        tradeMessageContainer: document.querySelector('.trade-message-container'),
        tradeMessage: document.querySelector('.trade-message'),
        differenceMessage: document.querySelector('.difference-message'),
        arrow: document.querySelector('.arrow-icon'),
        team1Value: document.querySelector('.team-1-value'),
        team2Value: document.querySelector('.team-2-value')
    };

    // Check if essential elements exist (only the ones we need for basic functionality)
    if (!elements.team1Value || !elements.team2Value) {
        console.error('Missing essential elements for value display');
        return;
    }

    // Log all selected players in DOM
    console.log('Team 1 DOM elements:', 
        Array.from(document.querySelector('[data-team="1"] .selected-players').children)
            .map(el => ({
                name: el.querySelector('.font-medium').textContent,
                valueText: el.querySelector('.text-sm.font-medium').textContent,
                rawValueElement: el.querySelector('.text-sm.font-medium')
            }))
    );

    console.log('Team 2 DOM elements:', 
        Array.from(document.querySelector('[data-team="2"] .selected-players').children)
            .map(el => ({
                name: el.querySelector('.font-medium').textContent,
                valueText: el.querySelector('.text-sm.font-medium').textContent,
                rawValueElement: el.querySelector('.text-sm.font-medium')
            }))
    );

    // Get players and calculate values
    const team1Players = Array.from(
        document.querySelector('[data-team="1"] .selected-players').children
    ).map(el => {
        const playerName = el.querySelector('.font-medium').textContent;
        const valueEl = el.querySelector('.text-sm.font-medium');
        console.log('Team 1 Player Element:', {
            name: playerName,
            valueElement: valueEl,
            valueText: valueEl?.textContent,
            fullElement: el.innerHTML
        });
        
        const playerValue = valueEl?.textContent.trim().split('\n')[0];
        const player = ALL_PLAYERS.find(p => p.Name === playerName);
        console.log('Found player in ALL_PLAYERS:', player);
        return player;
    }).filter(Boolean);

    const team2Players = Array.from(
        document.querySelector('[data-team="2"] .selected-players').children
    ).map(el => {
        const playerName = el.querySelector('.font-medium').textContent;
        const valueEl = el.querySelector('.text-sm.font-medium');
        console.log('Team 2 Player Element:', {
            name: playerName,
            valueElement: valueEl,
            valueText: valueEl?.textContent,
            fullElement: el.innerHTML
        });
        
        const playerValue = valueEl?.textContent.trim().split('\n')[0];
        const player = ALL_PLAYERS.find(p => p.Name === playerName);
        console.log('Found player in ALL_PLAYERS:', player);
        return player;
    }).filter(Boolean);

    // Calculate values
    const team1RawValue = team1Players.reduce((sum, p) => {
        console.log('Team 1 adding value:', {
            player: p.Name,
            value: p.Value,
            currentSum: sum
        });
        return sum + parseInt(p.Value || 0);
    }, 0);

    const team2RawValue = team2Players.reduce((sum, p) => {
        console.log('Team 2 adding value:', {
            player: p.Name,
            value: p.Value,
            currentSum: sum
        });
        return sum + parseInt(p.Value || 0);
    }, 0);

    console.log('Final Raw Values:', {
        team1: team1RawValue,
        team2: team2RawValue,
        team1Players,
        team2Players
    });

    // Calculate adjustments
    const team1Adjustment = Math.round(calculateTeamAdjustment(team1Players));
    const team2Adjustment = Math.round(calculateTeamAdjustment(team2Players));
    
    // Calculate final values
    const team1FinalValue = team1RawValue + team1Adjustment;
    const team2FinalValue = team2RawValue + team2Adjustment;

    console.log('Final Values after adjustments:', {
        team1: {
            raw: team1RawValue,
            adjustment: team1Adjustment,
            final: team1FinalValue
        },
        team2: {
            raw: team2RawValue,
            adjustment: team2Adjustment,
            final: team2FinalValue
        }
    });

    // Update the UI with the values
    elements.team1Value.textContent = team1FinalValue.toLocaleString();
    elements.team2Value.textContent = team2FinalValue.toLocaleString();

    // Only proceed with trade message updates if all required elements exist
    if (elements.tradeMessageContainer && elements.tradeMessage && elements.differenceMessage && elements.arrow) {
        // Update value adjustments display
        const valueAdjustment1 = document.querySelector('.value-adjustment-container-1');
        const valueAdjustment2 = document.querySelector('.value-adjustment-container-2');
        
        if (team1Adjustment > 0) {
            valueAdjustment1.style.display = 'block';
            valueAdjustment1.querySelector('.value-adjustment-1').textContent = `+${team1Adjustment.toLocaleString()}`;
        } else {
            valueAdjustment1.style.display = 'none';
        }

        if (team2Adjustment > 0) {
            valueAdjustment2.style.display = 'block';
            valueAdjustment2.querySelector('.value-adjustment-2').textContent = `+${team2Adjustment.toLocaleString()}`;
        } else {
            valueAdjustment2.style.display = 'none';
        }

        // Handle trade fairness message
        const difference = Math.abs(team1FinalValue - team2FinalValue);
        
        if (team1Players.length === 0 || team2Players.length === 0) {
            elements.tradeMessageContainer.style.display = 'none';
            return;
        }

        elements.tradeMessageContainer.style.display = 'block';
        
        if (difference <= 200) {
            // Fair trade
            elements.tradeMessageContainer.className = 'bg-blue-50 rounded p-4 mt-4 text-center trade-message-container';
            elements.tradeMessage.className = 'text-blue-600';
            elements.tradeMessage.textContent = 'Fair Trade';
            elements.differenceMessage.style.display = 'none';
            elements.arrow.style.display = 'none';
            elements.tradeBar.className = 'absolute inset-0 trade-bar transition-all duration-300 bg-blue-500';
        } else {
            // Unfair trade
            elements.tradeMessageContainer.className = 'bg-red-50 rounded p-4 mt-4 text-center trade-message-container';
            const favoredTeam = team1FinalValue > team2FinalValue ? 1 : 2;
            
            elements.tradeMessage.className = 'text-red-600';
            elements.tradeMessage.textContent = `Favors Team ${favoredTeam}`;
            elements.differenceMessage.style.display = 'block';
            elements.differenceMessage.textContent = 
                `Add a player worth ${difference.toLocaleString()} to Team ${favoredTeam === 1 ? 2 : 1} to even trade`;
            
            elements.arrow.style.display = 'inline';
            elements.arrow.style.transform = favoredTeam === 1 ? 'rotate(0deg)' : 'rotate(180deg)';
            elements.tradeBar.className = 'absolute inset-0 trade-bar transition-all duration-300 bg-red-500';
        }
    } else {
        console.warn('Trade message elements missing, skipping message updates');
    }
}

// Add this new function to handle player removal
function removePlayer(button, teamNumber) {
    const playerElement = button.closest('.flex').parentElement;
    playerElement.remove();
    
    // Reset the team value if no players remain
    const teamContainer = document.querySelector(`[data-team="${teamNumber}"] .selected-players`);
    if (teamContainer.children.length === 0) {
        document.querySelector(`.team-${teamNumber}-value`).textContent = '0';
        document.querySelector(`.value-adjustment-container-${teamNumber}`).style.display = 'none';
    }
    
    updateTotalPieces(teamNumber);
    updateTradeValues();
}