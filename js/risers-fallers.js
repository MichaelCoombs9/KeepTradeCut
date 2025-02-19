let currentPlayers = [];
let snapshotPlayers = [];
let valueChanges = [];

async function initialize() {
    try {
        // Show loading state
        document.getElementById('playersGrid').innerHTML = `
            <div class="col-span-full text-center py-8">
                <p class="text-gray-600">Loading player values...</p>
            </div>
        `;

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
        
        // Initialize social menu
        initializeSocialMenu();
    } catch (error) {
        console.error('Error initializing:', error);
        document.getElementById('playersGrid').innerHTML = `
            <div class="col-span-full text-center py-8">
                <p class="text-red-600">Error loading player data. Please try again later.</p>
            </div>
        `;
    }
}

async function loadCurrentPlayers() {
    const paths = ['/data/players.json', './data/players.json', '../data/players.json', 'players.json'];
    
    for (const path of paths) {
        try {
            const response = await fetch(path);
            if (response.ok) {
                return await response.json();
            }
        } catch (e) {
            console.log(`Tried path ${path}: ${e.message}`);
        }
    }
    throw new Error('Could not load current players data');
}

async function loadSnapshotData() {
    // Try to load the most recent snapshot within 30 days
    const paths = ['/data/snapshots', './data/snapshots', '../data/snapshots', 'snapshots'];
    
    for (const basePath of paths) {
        try {
            // First try to load the snapshot directly
            const today = new Date();
            const thirtyDaysAgo = new Date(today.setDate(today.getDate() - 30));
            
            // Try each date from today back to 30 days ago
            for (let d = new Date(); d >= thirtyDaysAgo; d.setDate(d.getDate() - 1)) {
                const dateStr = d.toISOString().split('T')[0];
                const snapshotPath = `${basePath}/${dateStr}.json`;
                
                try {
                    const response = await fetch(snapshotPath);
                    if (response.ok) {
                        const data = await response.json();
                        return data;
                    }
                } catch (e) {
                    continue; // Try next date
                }
            }
            
            // If no snapshot found in last 30 days, try the oldest available
            const response = await fetch(`${basePath}/2025-02-19.json`);
            if (response.ok) {
                return await response.json();
            }
        } catch (e) {
            console.log(`Tried base path ${basePath}: ${e.message}`);
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
    const snapshotDate = new Date(snapshotPlayers[0]?.timestamp || '2025-02-19');
    const formattedDate = snapshotDate.toLocaleDateString('en-US', {
        year: 'numeric',
        month: 'long',
        day: 'numeric'
    });
    document.getElementById('compareDate').textContent = formattedDate;
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
    
    // Take top 50 players
    filteredPlayers = filteredPlayers.slice(0, 50);
    
    // Render to grid
    const grid = document.getElementById('playersGrid');
    grid.innerHTML = filteredPlayers.map(player => `
        <div class="bg-white rounded-lg shadow-md p-4 flex items-center gap-4">
            <img src="${player.Headshot}" alt="${player.Name}" 
                 class="w-16 h-16 rounded-full object-cover"
                 onerror="this.src='https://img.mlbstatic.com/mlb-photos/image/upload/w_213,d_people:generic:headshot:silo:current.png,q_auto:best,f_auto/v1/people/generic/headshot/67/current'">
            <div class="flex-1">
                <div class="flex justify-between items-start">
                    <div>
                        <h3 class="font-bold">${player.Name}</h3>
                        <p class="text-sm text-gray-600">${player.Position} | ${player.Team} | Age: ${player.Age}</p>
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
                    Current Value: ${player.Value} (was ${player.oldValue})
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

// Initialize when DOM is loaded
document.addEventListener('DOMContentLoaded', initialize); 