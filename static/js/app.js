// Game state
let gameState = {
    numPlayers: 4,
    startingLife: 40,
    players: [],
    currentDamagePlayer: null
};

const playerColors = ['#e74c3c', '#3498db', '#2ecc71', '#f39c12', '#9b59b6', '#1abc9c'];

// Setup screen handlers
document.addEventListener('DOMContentLoaded', () => {
    // Player count buttons
    document.querySelectorAll('.player-count-btn').forEach(btn => {
        btn.addEventListener('click', () => {
            document.querySelectorAll('.player-count-btn').forEach(b => b.classList.remove('active'));
            btn.classList.add('active');
            gameState.numPlayers = parseInt(btn.dataset.players);
        });
    });

    // Starting life buttons
    document.querySelectorAll('.life-count-btn').forEach(btn => {
        btn.addEventListener('click', () => {
            document.querySelectorAll('.life-count-btn').forEach(b => b.classList.remove('active'));
            btn.classList.add('active');
            gameState.startingLife = parseInt(btn.dataset.life);
        });
    });
});

function startGame() {
    // Initialize players
    gameState.players = [];
    for (let i = 0; i < gameState.numPlayers; i++) {
        gameState.players.push({
            id: i,
            name: `Player ${i + 1}`,
            life: gameState.startingLife,
            color: playerColors[i],
            commanderDamage: Array(gameState.numPlayers).fill(0)
        });
    }

    // Hide setup, show game
    document.getElementById('setupScreen').style.display = 'none';
    document.getElementById('gameScreen').style.display = 'flex';

    renderPlayers();
}

function resetGame() {
    document.getElementById('setupScreen').style.display = 'flex';
    document.getElementById('gameScreen').style.display = 'none';
    gameState.players = [];
}

function renderPlayers() {
    const grid = document.getElementById('playersGrid');
    grid.className = `players-grid players-${gameState.numPlayers}`;
    grid.innerHTML = '';

    gameState.players.forEach(player => {
        const card = createPlayerCard(player);
        grid.appendChild(card);
    });
}

function createPlayerCard(player) {
    const card = document.createElement('div');
    card.className = `player-card ${player.life <= 0 ? 'dead' : ''}`;
    card.style.borderColor = player.color;

    const isDead = player.life <= 0;
    const totalDamage = player.commanderDamage.reduce((sum, dmg) => sum + dmg, 0);
    const maxDamage = Math.max(...player.commanderDamage);
    const isNearDeath = maxDamage >= 18;

    card.innerHTML = `
        <div class="player-header" style="background-color: ${player.color}">
            <h3 onclick="editPlayerName(${player.id})" id="playerName${player.id}">${player.name}</h3>
        </div>

        <div class="life-display" onclick="changeLife(${player.id}, 1)">
            <div class="life-total">${player.life}</div>
            ${isDead ? '<div class="status-overlay">DEAD</div>' : ''}
        </div>

        <div class="life-controls">
            <button class="life-btn life-minus" onclick="event.stopPropagation(); changeLife(${player.id}, -1)">-1</button>
            <button class="life-btn life-plus" onclick="event.stopPropagation(); changeLife(${player.id}, 1)">+1</button>
        </div>

        <div class="life-controls-large">
            <button class="life-btn-large life-minus-large" onclick="event.stopPropagation(); changeLife(${player.id}, -5)">-5</button>
            <button class="life-btn-large life-plus-large" onclick="event.stopPropagation(); changeLife(${player.id}, 5)">+5</button>
        </div>

        <button class="commander-damage-btn ${isNearDeath ? 'warning' : ''}" onclick="openDamageModal(${player.id})">
            <div class="damage-label">Commander Damage</div>
            <div class="damage-stats">
                <span>Total: ${totalDamage}</span>
                <span class="${isNearDeath ? 'max-warning' : ''}">Max: ${maxDamage}/21</span>
            </div>
        </button>
    `;

    return card;
}

function changeLife(playerId, amount) {
    gameState.players[playerId].life += amount;
    renderPlayers();
}

function editPlayerName(playerId) {
    const nameElement = document.getElementById(`playerName${playerId}`);
    const currentName = gameState.players[playerId].name;

    const input = document.createElement('input');
    input.type = 'text';
    input.value = currentName;
    input.className = 'name-input';

    input.onblur = () => {
        const newName = input.value.trim() || currentName;
        gameState.players[playerId].name = newName;
        renderPlayers();
    };

    input.onkeydown = (e) => {
        if (e.key === 'Enter') {
            input.blur();
        } else if (e.key === 'Escape') {
            gameState.players[playerId].name = currentName;
            renderPlayers();
        }
    };

    nameElement.replaceWith(input);
    input.focus();
    input.select();
}

function openDamageModal(playerId) {
    gameState.currentDamagePlayer = playerId;
    const player = gameState.players[playerId];

    document.getElementById('modalTitle').textContent = `Commander Damage to ${player.name}`;

    const damageGrid = document.getElementById('damageGrid');
    damageGrid.innerHTML = '';

    gameState.players.forEach(opponent => {
        if (opponent.id === playerId) return;

        const damage = player.commanderDamage[opponent.id];
        const isLethal = damage >= 21;

        const row = document.createElement('div');
        row.className = 'damage-row';
        row.innerHTML = `
            <div class="opponent-name" style="background-color: ${opponent.color}">
                ${opponent.name}
            </div>
            <div class="damage-controls">
                <button class="damage-btn damage-minus" onclick="changeCommanderDamage(${playerId}, ${opponent.id}, -1)">-</button>
                <div class="damage-value ${isLethal ? 'lethal' : ''}">
                    ${damage}
                    ${isLethal ? '<span class="lethal-badge">LETHAL</span>' : ''}
                </div>
                <button class="damage-btn damage-plus" onclick="changeCommanderDamage(${playerId}, ${opponent.id}, 1)">+</button>
            </div>
        `;

        damageGrid.appendChild(row);
    });

    document.getElementById('damageModal').style.display = 'flex';
}

function closeDamageModal(event) {
    if (!event || event.target.classList.contains('modal-overlay') || event.target.classList.contains('close-btn')) {
        document.getElementById('damageModal').style.display = 'none';
        gameState.currentDamagePlayer = null;
    }
}

function changeCommanderDamage(receiverId, dealerId, amount) {
    const newDamage = Math.max(0, gameState.players[receiverId].commanderDamage[dealerId] + amount);
    gameState.players[receiverId].commanderDamage[dealerId] = newDamage;

    // Re-render the modal and the player cards
    openDamageModal(receiverId);
    renderPlayers();
}
