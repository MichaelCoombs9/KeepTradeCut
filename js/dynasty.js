let allPlayers = []; // Store all players globally

async function loadRankings(positionFilter = 'Overall') {
    try {
        if (allPlayers.length === 0) {
            const response = await fetch('./data/players.json');
            if (!response.ok) throw new Error('Failed to load players');
            allPlayers = await response.json();
        }

        // Filter and sort players
        let filteredPlayers = allPlayers
            .filter(player => player.Rank) // Only show ranked players
            .sort((a, b) => parseInt(a.Rank) - parseInt(b.Rank));

        // Apply position filter
        if (positionFilter !== 'Overall') {
            if (positionFilter === 'Batters') {
                filteredPlayers = filteredPlayers.filter(player => 
                    !['SP', 'RP'].includes(player.Position)
                );
            } else if (positionFilter === 'Pitchers') {
                filteredPlayers = filteredPlayers.filter(player => 
                    ['SP', 'RP'].includes(player.Position)
                );
            } else {
                filteredPlayers = filteredPlayers.filter(player => 
                    player.Position === positionFilter
                );
            }
        }

        const tbody = document.getElementById('rankings-body');
        tbody.innerHTML = filteredPlayers.map(player => `
            <tr class="hover:bg-gray-50">
                <td class="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                    ${player.Rank}
                </td>
                <td class="px-6 py-4 whitespace-nowrap">
                    <div class="flex items-center">
                        <img class="h-10 w-10 rounded-full object-cover" src="${player.Headshot}" alt="">
                        <div class="ml-4">
                            <div class="text-sm font-medium text-gray-900">${player.Name}</div>
                        </div>
                    </div>
                </td>
                <td class="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    ${player.Position}
                </td>
                <td class="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    ${player.Team}
                </td>
                <td class="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    ${player.Age}
                </td>
            </tr>
        `).join('');

    } catch (error) {
        console.error('Error loading rankings:', error);
    }
}

function initializeFilters() {
    const filterButtons = document.querySelectorAll('.filter-btn');
    
    filterButtons.forEach(button => {
        button.addEventListener('click', () => {
            // Update active state
            filterButtons.forEach(btn => {
                btn.classList.remove('border-blue-600', 'text-blue-600');
                btn.classList.add('border-transparent', 'text-gray-500');
            });
            button.classList.remove('border-transparent', 'text-gray-500');
            button.classList.add('border-blue-600', 'text-blue-600');
            
            // Apply filter
            loadRankings(button.dataset.position);
        });
    });
}

// Initialize when page loads
document.addEventListener('DOMContentLoaded', () => {
    loadRankings();
    initializeFilters();
}); 