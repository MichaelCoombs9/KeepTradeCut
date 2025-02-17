// Replace the placeholder data with fetch from JSON
let ALL_PLAYERS = [];

async function loadPlayers() {
    try {
        const response = await fetch('/api/players');

        if (!response.ok) {
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

// Add this function to sort players by value
function sortPlayersByValue(players) {
    return [...players].sort((a, b) => parseInt(b.Value) - parseInt(a.Value));
}

// Update the document ready handler to include sorting
document.addEventListener('DOMContentLoaded', async () => {
    // Load players first
    const loaded = await loadPlayers();
    if (!loaded) {
        console.error('Failed to load players');
        return;
    }
    console.log('Players loaded:', ALL_PLAYERS.length);

    // Sort players by value for dynasty rankings
    if (window.location.pathname.includes('dynasty')) {
        const sortedPlayers = sortPlayersByValue(ALL_PLAYERS);
        const container = document.querySelector('.player-rankings');
        if (container) {
            container.innerHTML = sortedPlayers.map((player, index) => `
                <div class="flex items-center justify-between p-4 hover:bg-gray-50">
                    <div class="flex items-center gap-4">
                        <div class="text-gray-400 w-8">${index + 1}</div>
                        <img src="${player.Headshot}" class="w-12 h-12 rounded-full object-cover">
                        <div>
                            <div class="font-medium text-gray-900">${player.Name}</div>
                            <div class="text-sm text-gray-500">${player.Team} • ${player.Position}</div>
                        </div>
                    </div>
                    <div class="text-sm font-medium text-gray-600">${player.Value}</div>
                </div>
            `).join('');
        }
    }

    // Initialize search for both team sections
    document.querySelectorAll('.team-section').forEach(container => {
        setupPlayerSearch(container);
    });

    showKTCModal();
});

// Update setupPlayerSearch to handle all search functionality
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

    // Handle click outside
    document.addEventListener('click', (e) => {
        if (!searchInput.contains(e.target) && !suggestions.contains(e.target)) {
            clearSearch();
        }
    });

    // Handle player selection
    suggestions.addEventListener('click', function(e) {
        const clickedOption = e.target.closest('.player-option');
        if (!clickedOption) return;

        const clickedId = clickedOption.dataset.playerId;
        const selectedPlayer = ALL_PLAYERS.find(p => p.id === clickedId);
        
        if (selectedPlayer) {
            // Clear search input and suggestions before adding player
            clearSearch();
            
            // Add player to team
            const teamNumber = container.dataset.team;
            const teamContainer = document.querySelector(`[data-team="${teamNumber}"] .selected-players`);
            
            const playerElement = document.createElement('div');
            playerElement.className = 'flex items-center justify-between p-3 bg-white rounded-lg border border-gray-200 shadow-sm';
            playerElement.dataset.playerId = selectedPlayer.id;
            playerElement.innerHTML = `
                <div class="flex items-center gap-3">
                    <img src="${selectedPlayer.Headshot}" class="rounded-full w-10 h-10 object-cover">
                    <div>
                        <div class="font-medium text-gray-900">${selectedPlayer.Name}</div>
                        <div class="text-sm text-gray-500">${selectedPlayer.Team} • ${selectedPlayer.Position}</div>
                    </div>
                </div>
                <div class="flex items-center gap-3">
                    <div class="text-sm font-medium text-gray-600">
                        ${selectedPlayer.Value}
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

    // Handle search input
    const debouncedSearch = debounce((e) => {
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
                <div class="text-sm font-medium text-gray-600">
                    ${player.Value}
                </div>
            </div>
        `).join('');
    }, 200);

    searchInput.addEventListener('input', debouncedSearch);
}

// Add these functions near the top of the file
function calculateRawAdjustment(playerValue, topValue, maxValue) {
    // Make the adjustment more aggressive by increasing multipliers
    return playerValue * (
        0.15 + // Base multiplier increased from 0.1 to 0.15
        0.25 * Math.pow(playerValue / maxValue, 6) + // Reduced exponent and increased multiplier
        0.15 * Math.pow(playerValue / topValue, 1.3) + // Increased from 0.1 to 0.15
        0.15 * Math.pow(playerValue / (maxValue + 2000), 1.28) // Increased from 0.1 to 0.15
    );
}

function calculateTeamAdjustment(players, otherTeamPlayers) {
    console.log('Calculating adjustment for team:', {
        teamPlayerCount: players.length,
        otherTeamPlayerCount: otherTeamPlayers.length,
        teamPlayers: players.map(p => ({ name: p.Name, value: p.Value })),
        otherTeamPlayers: otherTeamPlayers.map(p => ({ name: p.Name, value: p.Value }))
    });

    if (!players.length) {
        console.log('No players in team, returning 0 adjustment');
        return 0;
    }
    
    // Only apply adjustment to team with fewer pieces
    if (players.length >= otherTeamPlayers.length) {
        console.log('Team has equal or more pieces, returning 0 adjustment');
        return 0;
    }

    // Find the highest value player in the trade
    const allValues = [...players, ...otherTeamPlayers].map(p => parseInt(p.Value));
    const topValue = Math.max(...allValues);
    const maxValue = Math.max(...ALL_PLAYERS.map(p => parseInt(p.Value)));
    
    console.log('Adjustment parameters:', {
        topValue,
        maxValue,
        pieceDifference: otherTeamPlayers.length - players.length
    });

    // Add multiplier based on piece difference
    const pieceDifferenceMultiplier = 1 + ((otherTeamPlayers.length - players.length) * 0.15);
    
    // Calculate total adjustment with piece difference multiplier
    const totalAdjustment = players.reduce((total, player) => {
        const baseAdjustment = calculateRawAdjustment(
            parseInt(player.Value), 
            topValue, 
            maxValue
        );
        const finalAdjustment = baseAdjustment * pieceDifferenceMultiplier;
        
        console.log('Player adjustment:', {
            player: player.Name,
            value: player.Value,
            baseAdjustment,
            multiplier: pieceDifferenceMultiplier,
            finalAdjustment
        });
        
        return total + finalAdjustment;
    }, 0);

    console.log('Final team adjustment:', totalAdjustment);
    return totalAdjustment;
}

function updateTradeValues() {
    console.log('=== Starting updateTradeValues ===');
    
    const elements = {
        tradeBar: document.querySelector('.trade-bar'),
        tradeMessageContainer: document.querySelector('.trade-message-container'),
        tradeMessage: document.querySelector('.trade-message'),
        differenceMessage: document.querySelector('.difference-message'),
        arrow: document.querySelector('.arrow-icon'),
        team1Value: document.querySelector('.team-1-value'),
        team2Value: document.querySelector('.team-2-value')
    };

    // Create trade message element if it doesn't exist
    if (!elements.tradeMessage && elements.tradeMessageContainer) {
        const messageSpan = document.createElement('span');
        messageSpan.className = 'trade-message';
        elements.tradeMessageContainer.querySelector('.flex').appendChild(messageSpan);
        elements.tradeMessage = messageSpan;
    }

    // Verify required elements exist
    if (!elements.tradeMessage || !elements.tradeMessageContainer) {
        console.error('Missing required trade message elements');
        return;
    }

    // Get and log players
    const team1Players = Array.from(document.querySelector('[data-team="1"] .selected-players').children)
        .map(el => {
            const playerName = el.querySelector('.font-medium').textContent;
            const player = ALL_PLAYERS.find(p => p.Name === playerName);
            console.log('Team 1 player found:', { name: playerName, value: player?.Value });
            return player;
        }).filter(Boolean);

    const team2Players = Array.from(document.querySelector('[data-team="2"] .selected-players').children)
        .map(el => {
            const playerName = el.querySelector('.font-medium').textContent;
            const player = ALL_PLAYERS.find(p => p.Name === playerName);
            console.log('Team 2 player found:', { name: playerName, value: player?.Value });
            return player;
        }).filter(Boolean);

    console.log('Player counts:', {
        team1: team1Players.length,
        team2: team2Players.length
    });

    // Calculate raw values and adjustments
    const team1RawValue = team1Players.reduce((sum, p) => sum + parseInt(p.Value || 0), 0);
    const team2RawValue = team2Players.reduce((sum, p) => sum + parseInt(p.Value || 0), 0);
    
    console.log('Calculating team adjustments...');
    const team1Adjustment = Math.round(calculateTeamAdjustment(team1Players, team2Players));
    console.log('Team 1 adjustment calculated:', team1Adjustment);

    const team2Adjustment = Math.round(calculateTeamAdjustment(team2Players, team1Players));
    console.log('Team 2 adjustment calculated:', team2Adjustment);

    // Calculate final values
    const team1FinalValue = team1RawValue + team1Adjustment;
    const team2FinalValue = team2RawValue + team2Adjustment;

    console.log('Final values after adjustments:', {
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

    // Update value displays
    elements.team1Value.textContent = team1FinalValue.toLocaleString();
    elements.team2Value.textContent = team2FinalValue.toLocaleString();

    // Always update adjustment displays (don't just check if > 0)
    const valueAdjustment1 = document.querySelector('.value-adjustment-container-1');
    const valueAdjustment2 = document.querySelector('.value-adjustment-container-2');

    // Team 1 adjustment
    if (team1Adjustment > 0) {
        valueAdjustment1.style.display = 'block';
        valueAdjustment1.querySelector('.value-adjustment-1').textContent = `+${team1Adjustment.toLocaleString()}`;
    } else {
        valueAdjustment1.style.display = 'none';
        valueAdjustment1.querySelector('.value-adjustment-1').textContent = '';
    }

    // Team 2 adjustment
    if (team2Adjustment > 0) {
        valueAdjustment2.style.display = 'block';
        valueAdjustment2.querySelector('.value-adjustment-2').textContent = `+${team2Adjustment.toLocaleString()}`;
    } else {
        valueAdjustment2.style.display = 'none';
        valueAdjustment2.querySelector('.value-adjustment-2').textContent = '';
    }

    // Now handle the trade message container
    // Calculate difference
    const difference = Math.abs(team1FinalValue - team2FinalValue);
    console.log('Trade difference:', { 
        difference,
        isFair: difference <= 200,
        currentMessage: elements.tradeMessage.textContent,
        currentBackground: elements.tradeMessageContainer.className
    });

    // Log current state before updates
    console.log('Current UI state before updates:', {
        messageText: elements.tradeMessage.textContent,
        messageClass: elements.tradeMessage.className,
        containerClass: elements.tradeMessageContainer.className,
        barClass: elements.tradeBar.className,
        barWidth: elements.tradeBar.style.width
    });

    // Reset ALL UI elements first
    elements.tradeMessageContainer.style.display = 'block';
    elements.tradeMessageContainer.innerHTML = `
        <div class="flex items-center justify-center gap-2">
            <svg class="w-5 h-5 arrow-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M7 16l-4-4m0 0l4-4m-4 4h18"></path>
            </svg>
            <span class="trade-message"></span>
        </div>
        <div class="difference-message mt-1 text-sm text-gray-600"></div>
    `;

    // Re-query elements after rebuilding HTML
    elements.tradeMessage = elements.tradeMessageContainer.querySelector('.trade-message');
    elements.differenceMessage = elements.tradeMessageContainer.querySelector('.difference-message');
    elements.arrow = elements.tradeMessageContainer.querySelector('.arrow-icon');

    // Hide elements by default
    elements.differenceMessage.style.display = 'none';
    elements.arrow.style.display = 'none';

    // Create or get the players-to-even container
    let playersToEvenContainer = document.querySelector('.players-to-even-container');
    if (!playersToEvenContainer) {
        playersToEvenContainer = document.createElement('div');
        playersToEvenContainer.className = 'players-to-even-container mt-4 bg-blue-50 rounded-lg border border-blue-100';
        elements.tradeMessageContainer.parentNode.insertBefore(playersToEvenContainer, elements.tradeMessageContainer.nextSibling);
    }

    // Update UI based on fairness
    if (difference <= 200) {
        console.log('Updating UI for fair trade');
        elements.tradeMessageContainer.className = 'bg-blue-50 rounded p-4 mt-4 text-center trade-message-container';
        elements.tradeMessage.className = 'text-blue-600';
        elements.tradeMessage.textContent = 'Fair Trade';
        elements.tradeBar.className = 'absolute inset-0 trade-bar transition-all duration-300 bg-blue-500';
        elements.tradeBar.style.width = '50%';
        playersToEvenContainer.style.display = 'none';
    } else {
        console.log('Updating UI for unfair trade');
        elements.tradeMessageContainer.className = 'bg-red-50 rounded p-4 mt-4 text-center trade-message-container';
        elements.tradeBar.className = 'absolute inset-0 trade-bar transition-all duration-300 bg-red-500';
        
        const favoredTeam = team1FinalValue > team2FinalValue ? 1 : 2;
        elements.tradeMessage.className = 'text-red-600';
        elements.tradeMessage.textContent = `Favors Team ${favoredTeam}`;
        
        elements.differenceMessage.style.display = 'block';
        elements.differenceMessage.textContent = 
            `Add a player worth ${difference.toLocaleString()} to Team ${favoredTeam === 1 ? 2 : 1} to even trade`;
        
        elements.arrow.style.display = 'inline';
        elements.arrow.style.transform = favoredTeam === 1 ? 'rotate(0deg)' : 'rotate(180deg)';
        
        const totalValue = team1FinalValue + team2FinalValue;
        const team1Percentage = (team1FinalValue / totalValue) * 100;
        elements.tradeBar.style.width = `${team1Percentage}%`;

        // Unfair trade - show suggested players
        const targetValue = difference;

        // Get IDs of players already in the trade
        const existingPlayerIds = [...team1Players, ...team2Players].map(p => p.id);

        // Find players close to the target value, excluding players already in the trade
        const suggestedPlayers = ALL_PLAYERS
            .filter(p => {
                // Exclude players already in the trade
                if (existingPlayerIds.includes(p.id)) return false;
                
                // Check if value is within 20% of target
                return Math.abs(parseInt(p.Value) - targetValue) < targetValue * 0.2;
            })
            .sort((a, b) => Math.abs(parseInt(a.Value) - targetValue) - Math.abs(parseInt(b.Value) - targetValue))
            .slice(0, 4); // Get top 4 closest matches

        playersToEvenContainer.style.display = 'block';
        playersToEvenContainer.innerHTML = `
            <div class="p-4">
                <div class="text-blue-600 font-medium mb-2">Players to Even Trade:</div>
                <div class="space-y-2">
                    ${suggestedPlayers.map(player => `
                        <div class="flex items-center justify-between bg-white p-3 rounded-lg border border-gray-200">
                            <div class="flex items-center gap-2">
                                <img src="${player.Headshot}" class="w-8 h-8 rounded-full object-cover">
                                <div>
                                    <div class="font-medium">${player.Name}</div>
                                    <div class="text-sm text-gray-500">${player.Team} • ${player.Position}</div>
                                </div>
                            </div>
                            <div class="text-sm font-medium text-gray-600">${player.Value}</div>
                        </div>
                    `).join('')}
                </div>
                <div class="mt-2 text-center">
                    <a href="/dynasty" class="text-blue-600 text-sm hover:underline">View in rankings</a>
                </div>
            </div>
        `;
    }

    // Log final state
    console.log('Final UI state:', {
        messageText: elements.tradeMessage.textContent,
        messageClass: elements.tradeMessage.className,
        containerClass: elements.tradeMessageContainer.className,
        barClass: elements.tradeBar.className,
        barWidth: elements.tradeBar.style.width
    });
    console.log('=== End updateTradeValues ===\n');
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