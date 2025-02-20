let currentPlayers = [];
let snapshotPlayers = [];
let valueChanges = [];
let snapshotDate = null;
let snapshotCache = {}; // Cache for snapshot files

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
        await calculateValueChanges();
        
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

async function getSnapshot(dateStr, basePath) {
    const key = `${basePath}/${dateStr}.json`;
    if (snapshotCache.hasOwnProperty(key)) {
        return snapshotCache[key];
    }
    try {
        const response = await fetch(key);
        if (response.ok) {
            const data = await response.json();
            snapshotCache[key] = data;
            return data;
        } else {
            snapshotCache[key] = null;
            return null;
        }
    } catch (e) {
        snapshotCache[key] = null;
        return null;
    }
}

async function loadSnapshotData() {
    const paths = ['/data/snapshots', './data/snapshots', '../data/snapshots', 'snapshots'];
    const now = new Date();
    // Use today's local midnight
    const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    
    for (const basePath of paths) {
        try {
            let foundSnapshots = [];
            let daysBack = 0;
            
            while (daysBack < 30) {
                const checkDate = new Date(today);
                checkDate.setDate(checkDate.getDate() - daysBack);
                // Skip if the checkDate is in the future relative to now
                if (checkDate > now) {
                    daysBack++;
                    continue;
                }
                const dateStr = checkDate.toISOString().split('T')[0];
                
                try {
                    const response = await fetch(`${basePath}/${dateStr}.json`);
                    if (response.ok) {
                        console.log(`Found snapshot for ${dateStr}`);
                        const data = await response.json();
                        foundSnapshots.push({ date: dateStr, data });
                    } else {
                        console.log(`No snapshot found for ${dateStr}, stopping search`);
                        break;
                    }
                } catch (e) {
                    console.log(`Error loading snapshot for ${dateStr}, stopping search`);
                    break;
                }
                daysBack++;
            }
            
            if (foundSnapshots.length > 0) {
                console.log(`Found ${foundSnapshots.length} snapshots`);
                foundSnapshots.sort((a, b) => a.date.localeCompare(b.date));
                snapshotDate = foundSnapshots[0].date; // store snapshot date globally
                return foundSnapshots[0].data;
            }
        } catch (e) {
            console.log(`Tried base path ${basePath}: ${e.message}`);
            continue;
        }
    }
    throw new Error('Could not load snapshot data');
}

async function getHistoricalValues(player, basePath) {
    const values = [];
    const dates = [];
    // Start from the snapshotDate if set; otherwise default to today
    const startDate = snapshotDate ? new Date(snapshotDate) : new Date();
    let daysBack = 0;
    
    while (daysBack < 30) {
        const checkDate = new Date(startDate);
        checkDate.setDate(checkDate.getDate() - daysBack);
        const dateStr = checkDate.toISOString().split('T')[0];
        
        const data = await getSnapshot(dateStr, basePath);
        if (data === null) {
            // No snapshot available for this date, break the loop.
            break;
        } else {
            const historicalPlayer = data.find(p => p.id === player.id);
            if (historicalPlayer) {
                values.push(historicalPlayer.Value);
                dates.push(dateStr);
            }
        }
        daysBack++;
    }
    
    return { values, dates };
}

function createSparkline(values, width = 100, height = 40, color = '#10B981') {
    if (values.length < 2) return '';
    
    const min = Math.min(...values);
    const max = Math.max(...values);
    const range = max - min;
    
    const points = values.map((value, index) => {
        const x = (index / (values.length - 1)) * width;
        const y = height - ((value - min) / range) * height;
        return `${x},${y}`;
    }).join(' ');
    
    return `
        <svg width="${width}" height="${height}" class="sparkline">
            <polyline
                fill="none"
                stroke="${color}"
                stroke-width="2"
                points="${points}"
            />
            <circle 
                cx="${width}"
                cy="${height - ((values[values.length-1] - min) / range) * height}"
                r="3"
                fill="${color}"
            />
        </svg>
    `;
}

async function calculateValueChanges() {
    const processedPlayers = [];
    
    for (const currentPlayer of currentPlayers) {
        const snapshotPlayer = snapshotPlayers.find(p => p.id === currentPlayer.id);
        if (!snapshotPlayer) continue;
        
        const valueChange = currentPlayer.Value - snapshotPlayer.Value;
        const percentChange = ((valueChange / snapshotPlayer.Value) * 100).toFixed(1);
        
        const { values } = await getHistoricalValues(currentPlayer, '/data/snapshots');
        
        processedPlayers.push({
            ...currentPlayer,
            valueChange,
            percentChange,
            oldValue: snapshotPlayer.Value,
            historicalValues: values
        });
    }
    
    valueChanges = processedPlayers;
}

function updateDateInfo() {
    const snapshotDateObj = snapshotDate ? new Date(snapshotDate) : new Date('2025-02-19');
    const formattedDate = snapshotDateObj.toLocaleDateString('en-US', {
        year: 'numeric',
        month: 'long',
        day: 'numeric'
    });
    document.getElementById('compareDate').textContent = formattedDate;
}

function renderPlayers(position = 'all', sortBy = 'risers') {
    let filteredPlayers = valueChanges;
    
    if (position !== 'all') {
        filteredPlayers = filteredPlayers.filter(p => p.Position === position);
    }
    
    filteredPlayers.sort((a, b) => {
        return sortBy === 'risers' 
            ? b.valueChange - a.valueChange 
            : a.valueChange - b.valueChange;
    });
    
    filteredPlayers = filteredPlayers.slice(0, 50);
    
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
                    <div class="text-right flex items-center gap-2">
                        <div class="trend-graph">
                            ${createSparkline(player.historicalValues || [player.oldValue, player.Value], 60, 30, 
                                player.valueChange > 0 ? '#10B981' : '#EF4444')}
                        </div>
                        <div>
                            <p class="font-bold ${player.valueChange > 0 ? 'text-green-600' : 'text-red-600'}">
                                ${player.valueChange > 0 ? '+' : ''}${player.valueChange}
                            </p>
                            <p class="text-sm text-gray-600">
                                ${player.valueChange > 0 ? '+' : ''}${player.percentChange}%
                            </p>
                        </div>
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

