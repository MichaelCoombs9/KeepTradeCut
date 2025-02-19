let currentPlayers = [];
let snapshotPlayers = [];
let valueChanges = [];

async function initialize() {
    try {
        // Load current players
        currentPlayers = await loadCurrentPlayers();
        
        // Load snapshot data
        snapshotPlayers = await loadSnapshotData();
        
        // Calculate value changes
        calculateValueChanges();
        
        // Update UI
        updateDateInfo();
        renderPlayers();
        
        // Initialize filters
        initializeFilters();
    } catch (error) {
        console.error('Error initializing:', error);
    }
}

async function loadCurrentPlayers() {
    const paths = ['/data/players.json', './data/players.json', '../data/players.json', 'players.json'];
    
    for (const path of paths) {
        try {
            const response = await fetch(path);
            if (response.ok) {
                const data = await response.json();
                return data;
            }
        } catch (e) {
            console.log(`Tried path ${path}: ${e.message}`);
        }
    }
    throw new Error('Could not load current players data');
}

async function loadSnapshotData() {
    // Get list of available snapshots
    const paths = ['/data/snapshots', './data/snapshots', '../data/snapshots', 'snapshots'];
    let snapshotFiles = [];
    
    for (const basePath of paths) {
        try {
            const response = await fetch(`${basePath}/index.json`);
            if (response.ok) {
                snapshotFiles = await response.json();
                break;
            }
        } catch (e) {
            console.log(`Tried path ${basePath}: ${e.message}`);
        }
    }

    // Get the oldest snapshot within 30 days
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
    
    const validSnapshots = snapshotFiles
        .filter(file => new Date(file.split('.')[0]) >= thirtyDaysAgo)
        .sort();
    
    const snapshotToUse = validSnapshots[0] || snapshotFiles[0];
    
    // Load the snapshot data
    for (const basePath of paths) {
        try {
            const response = await fetch(`${basePath}/${snapshotToUse}`);
            if (response.ok) {
                return await response.json();
            }
        } catch (e) {
            console.log(`Tried path ${basePath}/${snapshotToUse}: ${e.message}`);
        }
    }
    throw new Error('Could not load snapshot data');
}

function calculateValueChanges() {
    valueChanges = currentPlayers.map(currentPlayer => {
        const snapshotPlayer = snapshotPlayers.find(p => p.id === currentPlayer.id);
        if (!snapshotPlayer) return null;

        const valueChange = currentPlayer.Value - snapshotPlayer.Value;
        const percentChange = ((valueChange / snapshotPlayer.Value) * 100).toFixed(1);

        return {
            ...currentPlayer,
            valueChange,
            percentChange,
            oldValue: snapshotPlayer.Value
        };
    }).filter(player => player !== null);
}

function updateDateInfo() {
    const compareDate = snapshotPlayers[0]?.timestamp || 'earliest available data';
    document.getElementById('compareDate').textContent = compareDate;
}

function renderPlayers(position = 'all', sortBy = 'risers') {
    let filteredPlayers = valueChanges;
    
    // Apply position filter
    if (position !== 'all') {
        filteredPlayers = filteredPlayers.filter(p => p.Position === position);
    }
    
    // Apply sorting
    filteredPlayers.sort((a, b) => {
        return sortBy === 'risers' 
            ? b.valueChange - a.valueChange 
            : a.valueChange - b.valueChange;
    });
    
    // Render to grid
    const grid = document.getElementById('playersGrid');
    grid.innerHTML = filteredPlayers.map(player => `
        <div class="bg-white rounded-lg shadow-md p-4 flex items-center gap-4">
            <img src="${player.Headshot}" alt="${player.Name}" class="w-16 h-16 rounded-full">
            <div class="flex-1">
                <div class="flex justify-between items-start">
                    <div>
                        <h3 class="font-bold">${player.Name}</h3>
                        <p class="text-sm text-gray-600">${player.Position} | ${player.Team}</p>
                    </div>
                    <div class="text-right">
                        <p class="font-bold ${player.valueChange > 0 ? 'text-green-600' : 'text-red-600'}">
                            ${player.valueChange > 0 ? '+' : ''}${player.valueChange}
                        </p>
                        <p class="text-sm text-gray-600">
                            ${player.valueChange > 0 ? '+' : ''}${player.percentChange}%
                        </p>
                    </div>
                </div>
                <div class="mt-2 text-sm text-gray-600">
                    Value: ${player.Value} (was ${player.oldValue})
                </div>
            </div>
        </div>
    `).join('');
}

function initializeFilters() {
    const positionFilter = document.getElementById('positionFilter');
    const sortOrder = document.getElementById('sortOrder');
    
    positionFilter.addEventListener('change', () => {
        renderPlayers(positionFilter.value, sortOrder.value);
    });
    
    sortOrder.addEventListener('change', () => {
        renderPlayers(positionFilter.value, sortOrder.value);
    });
}

// Initialize when DOM is loaded
document.addEventListener('DOMContentLoaded', initialize); 