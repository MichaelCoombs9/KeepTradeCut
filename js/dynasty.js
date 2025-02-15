async function loadRankings() {
    try {
        const response = await fetch('./data/players.json');
        if (!response.ok) throw new Error('Failed to load players');
        
        let players = await response.json();

        // Sort players by rank
        players = players
            .filter(player => player.Rank) // Only show ranked players
            .sort((a, b) => parseInt(a.Rank) - parseInt(b.Rank));

        const tbody = document.getElementById('rankings-body');
        tbody.innerHTML = players.map(player => `
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

// Load rankings when the page loads
document.addEventListener('DOMContentLoaded', loadRankings); 