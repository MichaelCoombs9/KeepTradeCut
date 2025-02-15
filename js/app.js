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
        
        // Add missing fields and clean up data
        players = players.map((player, index) => ({
            Number: player.Number || String(index + 1),  // Use index+1 if Number is missing
            Hand: player.Hand || '-',                    // Use '-' if Hand is missing
            Age: player.Age || '??',                     // Use '??' if Age is missing
            Team: player.Team || 'FA',                   // Use 'FA' if Team is missing
            Name: player.Name,
            Position: player.Position || 'Unknown',      // Use 'Unknown' if Position is missing
            Headshot: player.Headshot || 'https://img.mlbstatic.com/mlb-photos/image/upload/w_213,d_people:generic:headshot:silo:current.png,q_auto:best,f_auto/v1/people/generic/headshot/67/current'
        }));

        // Remove duplicates based on Name (since Number might be auto-generated)
        const uniquePlayers = Array.from(new Map(players.map(player => [player.Name, player])).values());
        console.log(`Loaded ${uniquePlayers.length} unique players`);
        
        ALL_PLAYERS = uniquePlayers.map(player => ({
            ...player,
            id: player.Number,
            value: Math.floor(Math.random() * 2000) + 8000,
            trend: ['up', 'down', 'stable'][Math.floor(Math.random() * 3)]
        }));

        return true;
    } catch (error) {
        console.error('Error loading players:', error);
        // Fallback to some sample data if loading fails
        ALL_PLAYERS = [
            {
                "Number": "1",
                "Hand": "R",
                "Age": "28",
                "Team": "SF",
                "Name": "Logan Webb",
                "Position": "Pitcher",
                "Headshot": "http://cdn.ssref.net/scripts/image_resize.cgi?min=200&url=https://www.baseball-reference.com/req/202412180/images/headshots/a/af25c562_mlbam.jpg",
                "id": "1",
                "value": 9500,
                "trend": "up"
            },
            {
                "Number": "2",
                "Hand": "R",
                "Age": "34",
                "Team": "Phi",
                "Name": "Zack Wheeler",
                "Position": "Pitcher",
                "Headshot": "http://cdn.ssref.net/scripts/image_resize.cgi?min=200&url=https://www.baseball-reference.com/req/202412180/images/headshots/c/ceefd163_mlbam.jpg",
                "id": "2",
                "value": 9300,
                "trend": "stable"
            },
            {
                "Number": "3",
                "Hand": "R",
                "Age": "31",
                "Team": "Phi",
                "Name": "Aaron Nola",
                "Position": "Pitcher",
                "Headshot": "http://cdn.ssref.net/scripts/image_resize.cgi?min=200&url=https://www.baseball-reference.com/req/202412180/images/headshots/6/62b4d109_mlbam.jpg",
                "id": "3",
                "value": 9100,
                "trend": "down"
            }
        ];
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
    return `
        <div class="border rounded-lg p-6 bg-gray-50" data-player-id="${player.id}">
            <div class="text-center">
                <img src="${player.Headshot}" alt="${player.Name}" 
                     class="w-32 h-32 mx-auto rounded-full object-cover border-4 border-white shadow-lg
                            transform transition-transform duration-500 hover:scale-105">
                <h3 class="text-xl font-bold mt-4 text-gray-900">${player.Name}</h3>
                <p class="text-gray-500 mb-1">${player.Team} • ${player.Position}</p>
                <p class="text-gray-400 text-sm mb-4">${player.Age} y/o • ${player.Hand}</p>
                <div class="flex flex-col gap-2">
                    <button onclick="handleVote(${player.id}, 'keep')" 
                            class="w-full py-2 bg-[#98e5a7] rounded-lg transition-all duration-300 
                                   transform hover:-translate-y-[2px] hover:shadow-lg">
                        Keep
                    </button>
                    <button onclick="handleVote(${player.id}, 'trade')" 
                            class="w-full py-2 bg-[#f3d676] rounded-lg transition-all duration-300
                                   transform hover:-translate-y-[2px] hover:shadow-lg">
                        Trade
                    </button>
                    <button onclick="handleVote(${player.id}, 'cut')" 
                            class="w-full py-2 bg-[#f1a7a7] rounded-lg transition-all duration-300
                                   transform hover:-translate-y-[2px] hover:shadow-lg">
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
        const currentVote = votes.get(parseInt(playerId));
        
        card.querySelectorAll('button').forEach(button => {
            const buttonType = button.textContent.toLowerCase().trim();
            
            if (currentVote) {
                if (buttonType === currentVote) {
                    button.classList.remove('opacity-40', 'scale-95');
                    button.classList.add('border-2', 'border-blue-500', 'scale-100');
                    // Add pulse animation when selected
                    button.animate([
                        { transform: 'scale(1)', boxShadow: '0 0 0 0 rgba(59, 130, 246, 0.5)' },
                        { transform: 'scale(1.02)', boxShadow: '0 0 0 10px rgba(59, 130, 246, 0)' }
                    ], {
                        duration: 600,
                        easing: 'ease-out'
                    });
                } else {
                    button.classList.add('opacity-40', 'scale-95');
                    button.classList.remove('border-2', 'border-blue-500', 'scale-100');
                }
            } else {
                button.classList.remove('opacity-40', 'scale-95', 'border-2', 'border-blue-500', 'scale-100');
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
    document.getElementById('submit-ktc').addEventListener('click', () => {
        if (votes.size === 3) {
            // Here you would save the votes to your backend
            console.log('Votes:', Object.fromEntries(votes));
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
                            ${player.value || ''}
                            ${player.trend ? (player.trend === 'up' ? '↑' : player.trend === 'down' ? '↓' : '') : ''}
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
    const teamContainer = document.querySelector(`[data-team="${teamNumber}"] .selected-players`);
    
    const playerElement = document.createElement('div');
    playerElement.className = 'flex items-center justify-between p-3 bg-white rounded-lg border border-gray-200 shadow-sm';
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
                ${player.value}
                ${player.trend === 'up' ? '↑' : player.trend === 'down' ? '↓' : ''}
            </div>
            <button class="text-gray-400 hover:text-red-500" onclick="this.closest('.flex').parentElement.remove(); updateTotalPieces('${teamNumber}')">×</button>
        </div>
    `;
    
    teamContainer.appendChild(playerElement);
    updateTotalPieces(teamNumber);
}

function updateTotalPieces(teamNumber) {
    const count = document.querySelector(`[data-team="${teamNumber}"] .selected-players`).children.length;
    document.querySelector(`[data-team="${teamNumber}"] .total-pieces`).textContent = `${count} Total Pieces`;
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
    const loaded = await loadPlayers();
    if (!loaded) {
        console.warn('Using fallback player data');
    }
    showKTCModal();
    initializeSearchBoxes();
});

// Add this function back
function createKTCModal() {
    const modal = document.createElement('div');
    modal.className = 'fixed inset-0 bg-black/50 flex items-center justify-center z-50';
    modal.id = 'ktc-modal';
    
    modal.innerHTML = `
        <div class="bg-white rounded-xl shadow-xl max-w-4xl w-full mx-4 p-8">
            <div class="max-w-2xl mx-auto">
                <h2 class="text-3xl font-bold text-center mb-4">Your Thoughts?</h2>
                <p class="text-center text-gray-600 mb-2">
                    KTC's values are crowdsourced from users like you.
                </p>
                <p class="text-center text-gray-600 mb-8">
                    <span class="font-medium">Keep</span> the most valuable, 
                    <span class="font-medium">Trade</span> the second in value, and 
                    <span class="font-medium">Cut</span> the least valuable.
                </p>
                
                <div class="grid grid-cols-1 md:grid-cols-3 gap-8" id="playerCards">
                    <!-- Player cards will be inserted here -->
                </div>

                <div class="mt-8 text-center">
                    <button id="submit-ktc" 
                            class="w-full max-w-md bg-blue-600 text-white px-8 py-3 rounded-lg 
                                   hover:bg-blue-700 transition-all disabled:opacity-50 disabled:cursor-not-allowed">
                        Submit for Dynasty Baseball
                    </button>
                    <p class="mt-4 text-sm text-blue-600 hover:underline cursor-pointer" id="skip-players">
                        I don't know all of these players
                    </p>
                </div>
            </div>
        </div>
    `;

    return modal;
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