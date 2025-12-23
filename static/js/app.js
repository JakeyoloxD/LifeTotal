// Game state
let gameState = {
    numPlayers: 4,
    startingLife: 40,
    players: [],
    currentDamagePlayer: null,
    isPortrait: window.innerHeight > window.innerWidth
};

const playerColors = ['#e74c3c', '#3498db', '#2ecc71', '#f39c12', '#9b59b6', '#1abc9c'];

// Hold gesture state for each player
const holdState = {};

function initHoldState(playerId) {
    holdState[playerId] = {
        interval: null,
        timeout: null,
        stepTimeout: null,
        speed: 150,
        step: 1,
        isAggressive: false,
        holdDuration: 200,
        aggressiveThreshold: 2000
    };
}

// Detect orientation changes
window.addEventListener('resize', () => {
    const wasPortrait = gameState.isPortrait;
    gameState.isPortrait = window.innerHeight > window.innerWidth;

    // Re-render if orientation changed
    if (wasPortrait !== gameState.isPortrait && gameState.players.length > 0) {
        renderPlayers();
    }
});

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
            commanderDamage: Array(gameState.numPlayers).fill(0),
            infect: 0 // Poison counters (10 = death)
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

function shouldPlayerRotate(playerId, numPlayers, isPortrait) {
    // Rotate players on "opposite side" based on orientation

    if (numPlayers === 2) {
        // Portrait: top player rotated (id 0)
        // Landscape: left player rotated (id 0)
        return playerId === 0;
    }

    if (numPlayers === 3) {
        // Portrait: top player rotated (id 0)
        // Landscape: left player rotated (id 0)
        return playerId === 0;
    }

    if (numPlayers === 4) {
        // Portrait: top row rotated (ids 0, 1)
        // Landscape: left column rotated (ids 0, 2)
        if (isPortrait) {
            return playerId < 2; // Top row
        } else {
            return playerId % 2 === 0; // Left column (0, 2)
        }
    }

    if (numPlayers === 5) {
        // Portrait: top 2 rows rotated (ids 0, 1, 2)
        // Landscape: left column rotated (ids 0, 2, 4)
        if (isPortrait) {
            return playerId < 3; // Top 3 (2×3 grid, top 2 rows)
        } else {
            return playerId % 2 === 0; // Left column
        }
    }

    if (numPlayers === 6) {
        // Portrait: top half rotated (ids 0, 1, 2)
        // Landscape: left half rotated (ids 0, 2, 4)
        if (isPortrait) {
            return playerId < 3; // Top half
        } else {
            return playerId % 2 === 0; // Left column
        }
    }

    return false;
}

function renderPlayers() {
    const grid = document.getElementById('playersGrid');
    const isPortrait = gameState.isPortrait;

    // Add orientation class to grid
    grid.className = `players-grid players-${gameState.numPlayers} ${isPortrait ? 'portrait' : 'landscape'}`;
    grid.innerHTML = '';

    gameState.players.forEach(player => {
        const card = createPlayerCard(player);
        grid.appendChild(card);
    });
}

function createPlayerCard(player) {
    const card = document.createElement('div');

    // Determine rotation based on player position AND orientation
    const shouldRotate = shouldPlayerRotate(player.id, gameState.numPlayers, gameState.isPortrait);
    card.className = `player-card ${player.life <= 0 ? 'dead' : ''} ${shouldRotate ? 'rotate-180' : ''}`;
    card.style.borderColor = player.color;

    const isDead = player.life <= 0 || player.infect >= 10;
    const maxDamage = Math.max(...player.commanderDamage);
    const isNearDeath = maxDamage >= 18;
    const isInfectLethal = player.infect >= 8;

    card.innerHTML = `
        <div class="player-header" style="background-color: ${player.color}">
            <h3 onclick="editPlayerName(${player.id})" id="playerName${player.id}">${player.name}</h3>
        </div>

        <div class="life-display" id="lifeDisplay${player.id}">
            <div class="tap-zone tap-left" id="tapLeft${player.id}"></div>
            <div class="life-total">${player.life}</div>
            <div class="tap-zone tap-right" id="tapRight${player.id}"></div>
            ${isDead ? '<div class="status-overlay">DEAD</div>' : ''}
        </div>

        <button class="commander-damage-btn ${isNearDeath ? 'warning' : ''}" onclick="openDamageModal(${player.id})">
            <div class="damage-compact">
                ${player.commanderDamage.map((dmg, idx) => {
                    if (idx === player.id) return '';
                    return dmg > 0 ? `<span class="${dmg >= 18 ? 'max-warning' : ''}">${dmg}</span>` : '';
                }).filter(x => x).join('') || '<span>⚔️</span>'}
                ${player.infect > 0 ? `<span class="infect-badge ${isInfectLethal ? 'lethal' : ''}">☠️ ${player.infect}</span>` : ''}
            </div>
        </button>
    `;

    // Set up tap/hold gestures after card is created
    setTimeout(() => setupTapHold(player.id), 0);

    return card;
}

function setupTapHold(playerId) {
    initHoldState(playerId);

    const leftZone = document.getElementById(`tapLeft${playerId}`);
    const rightZone = document.getElementById(`tapRight${playerId}`);

    if (!leftZone || !rightZone) return;

    // LEFT ZONE - Decrease life
    leftZone.addEventListener('click', (e) => {
        e.stopPropagation();
        changeLife(playerId, -1);
    });

    leftZone.addEventListener('mousedown', (e) => {
        e.stopPropagation();
        startHold(playerId, -1);
    });

    leftZone.addEventListener('mouseup', (e) => {
        e.stopPropagation();
        stopHold(playerId);
    });

    leftZone.addEventListener('mouseleave', (e) => {
        stopHold(playerId);
    });

    leftZone.addEventListener('touchstart', (e) => {
        e.stopPropagation();
        e.preventDefault();
        startHold(playerId, -1);
    });

    leftZone.addEventListener('touchend', (e) => {
        e.stopPropagation();
        e.preventDefault();
        stopHold(playerId);
    });

    // RIGHT ZONE - Increase life
    rightZone.addEventListener('click', (e) => {
        e.stopPropagation();
        changeLife(playerId, 1);
    });

    rightZone.addEventListener('mousedown', (e) => {
        e.stopPropagation();
        startHold(playerId, 1);
    });

    rightZone.addEventListener('mouseup', (e) => {
        e.stopPropagation();
        stopHold(playerId);
    });

    rightZone.addEventListener('mouseleave', (e) => {
        stopHold(playerId);
    });

    rightZone.addEventListener('touchstart', (e) => {
        e.stopPropagation();
        e.preventDefault();
        startHold(playerId, 1);
    });

    rightZone.addEventListener('touchend', (e) => {
        e.stopPropagation();
        e.preventDefault();
        stopHold(playerId);
    });
}

function startHold(playerId, direction) {
    const state = holdState[playerId];

    state.timeout = setTimeout(() => {
        const incrementFunc = () => {
            changeLife(playerId, direction * state.step);

            // Accelerate speed
            if (!state.isAggressive) {
                state.speed = Math.max(state.speed / 1.2, 50);
            } else {
                state.speed = Math.max(state.speed / 1.1, 5);
            }

            const player = gameState.players[playerId];
            if (player && player.life > 100) {
                state.speed = Math.max(state.speed / 1.05, 1);
            }

            // Restart interval with new speed
            clearInterval(state.interval);
            state.interval = setInterval(incrementFunc, state.speed);
        };

        state.interval = setInterval(incrementFunc, state.speed);

        // Enter aggressive mode after threshold
        setTimeout(() => {
            state.isAggressive = true;
        }, state.aggressiveThreshold);

        // Increase step size over time
        setTimeout(() => { state.step = 10; }, 20000);
        setTimeout(() => { state.step = 100; }, 60000);
        setTimeout(() => { state.step = 1000; }, 120000);

    }, state.holdDuration);
}

function stopHold(playerId) {
    const state = holdState[playerId];

    clearTimeout(state.timeout);
    clearInterval(state.interval);
    clearTimeout(state.stepTimeout);

    state.speed = 150;
    state.step = 1;
    state.isAggressive = false;
}

function changeLife(playerId, amount) {
    gameState.players[playerId].life += amount;

    // Update just the life total instead of re-rendering everything
    const lifeTotal = document.querySelector(`#lifeDisplay${playerId} .life-total`);
    if (lifeTotal) {
        lifeTotal.textContent = gameState.players[playerId].life;
    }

    // Check if player is dead (life <= 0 OR infect >= 10)
    const lifeDisplay = document.getElementById(`lifeDisplay${playerId}`);
    const playerCard = lifeDisplay?.closest('.player-card');
    if (playerCard) {
        const player = gameState.players[playerId];
        const isDead = player.life <= 0 || player.infect >= 10;

        if (isDead) {
            playerCard.classList.add('dead');
            if (!lifeDisplay.querySelector('.status-overlay')) {
                const overlay = document.createElement('div');
                overlay.className = 'status-overlay';
                overlay.textContent = 'DEAD';
                lifeDisplay.appendChild(overlay);
            }
        } else {
            playerCard.classList.remove('dead');
            const overlay = lifeDisplay.querySelector('.status-overlay');
            if (overlay) overlay.remove();
        }
    }
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

    document.getElementById('modalTitle').textContent = `${player.name}`;

    const damageGrid = document.getElementById('damageGrid');
    damageGrid.innerHTML = '';

    // Infect/Poison counters
    const infectLethal = player.infect >= 10;
    const infectRow = document.createElement('div');
    infectRow.className = 'damage-row';
    infectRow.innerHTML = `
        <div class="opponent-name" style="background-color: #9b59b6">
            ☠️ Infect
        </div>
        <div class="damage-controls">
            <button class="damage-btn damage-minus" onclick="changeInfect(${playerId}, -1)">-</button>
            <div class="damage-value ${infectLethal ? 'lethal' : ''}">
                ${player.infect}
                ${infectLethal ? '<span class="lethal-badge">LETHAL</span>' : ''}
            </div>
            <button class="damage-btn damage-plus" onclick="changeInfect(${playerId}, 1)">+</button>
        </div>
    `;
    damageGrid.appendChild(infectRow);

    // Commander damage from each opponent
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

function changeInfect(playerId, amount) {
    gameState.players[playerId].infect = Math.max(0, Math.min(20, gameState.players[playerId].infect + amount));

    // Re-render the modal and the player cards
    openDamageModal(playerId);
    renderPlayers();
}

function changeCommanderDamage(receiverId, dealerId, amount) {
    const newDamage = Math.max(0, gameState.players[receiverId].commanderDamage[dealerId] + amount);
    gameState.players[receiverId].commanderDamage[dealerId] = newDamage;

    // Re-render the modal and the player cards
    openDamageModal(receiverId);
    renderPlayers();
}
