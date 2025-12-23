# Building a Lifetap-Style MTG Commander Tracker

## Complete Guide: From Zero to Production

This guide explains how to build a mobile-optimized life tracking app with **tap left/right** and **hold-to-accelerate** gestures, inspired by Carbon and Lifelinker.

---

## Table of Contents

1. [Core Concept](#core-concept)
2. [Technology Stack](#technology-stack)
3. [Project Structure](#project-structure)
4. [Step-by-Step Implementation](#step-by-step-implementation)
5. [Tap/Hold Gesture System](#taphold-gesture-system)
6. [Mobile Optimization](#mobile-optimization)
7. [Commander Damage Tracking](#commander-damage-tracking)
8. [Testing & Deployment](#testing--deployment)

---

## Core Concept

### What Makes a Lifetap App?

A "lifetap" app has these key interactions:

- **Tap left side** → Decrease by 1
- **Tap right side** → Increase by 1
- **Hold left** → Accelerating decrease (1/sec → 10/sec → 100/sec)
- **Hold right** → Accelerating increase (1/sec → 10/sec → 100/sec)

### Why This Works

- **Mobile-first**: Large tap zones for fingers
- **Fast adjustments**: Hold for big life swings
- **Minimal UI**: No cluttered buttons
- **Natural feel**: Left = down, Right = up

---

## Technology Stack

### Backend: Python + Flask

**Why Flask?**
- Simple, no build process
- Easy to deploy (Heroku, PythonAnywhere, etc.)
- Serves static HTML/CSS/JS

```bash
pip install Flask
```

### Frontend: Vanilla JavaScript

**Why no React/Vue/Angular?**
- No npm dependencies
- No build step
- Fast load times
- Works offline

### CSS: Mobile-First Design

- Flexbox/Grid for layouts
- `touch-action` for gesture control
- Active states for visual feedback

---

## Project Structure

```
your-app/
├── app.py                 # Flask server
├── requirements.txt       # Python dependencies
├── templates/
│   └── index.html        # Main HTML
└── static/
    ├── css/
    │   └── style.css     # All styles
    └── js/
        └── app.js        # Game logic + gestures
```

---

## Step-by-Step Implementation

### Step 1: Flask Server Setup

**File: `app.py`**

```python
from flask import Flask, render_template

app = Flask(__name__)

@app.route('/')
def index():
    return render_template('index.html')

if __name__ == '__main__':
    app.run(debug=True, host='0.0.0.0', port=5000)
```

**File: `requirements.txt`**

```
Flask==3.0.0
```

### Step 2: HTML Structure

**Key Points:**
- Life display split into left/right tap zones
- No visible buttons (gestures only)
- Modal for commander damage

**File: `templates/index.html`**

```html
<div class="life-display" id="lifeDisplay0">
    <!-- Left tap zone (invisible) -->
    <div class="tap-zone tap-left" id="tapLeft0"></div>

    <!-- Life total (centered) -->
    <div class="life-total">40</div>

    <!-- Right tap zone (invisible) -->
    <div class="tap-zone tap-right" id="tapRight0"></div>
</div>
```

### Step 3: CSS for Tap Zones

**Critical CSS:**

```css
.life-display {
    position: relative;
    flex: 1;
    display: flex;
    align-items: center;
    justify-content: center;
}

.tap-zone {
    position: absolute;
    top: 0;
    bottom: 0;
    width: 50%;        /* Each zone is half the width */
    z-index: 1;
    cursor: pointer;
}

.tap-left {
    left: 0;
}

.tap-left:active {
    background: rgba(231, 76, 60, 0.2);  /* Red flash */
}

.tap-right {
    right: 0;
}

.tap-right:active {
    background: rgba(46, 204, 113, 0.2); /* Green flash */
}

.life-total {
    font-size: 5rem;
    font-weight: 900;
    z-index: 0;
    pointer-events: none;  /* Don't block tap zones */
}
```

### Step 4: JavaScript Game State

**File: `static/js/app.js`**

```javascript
let gameState = {
    numPlayers: 4,
    startingLife: 40,
    players: []
};

// Initialize players
for (let i = 0; i < gameState.numPlayers; i++) {
    gameState.players.push({
        id: i,
        name: `Player ${i + 1}`,
        life: gameState.startingLife,
        commanderDamage: Array(gameState.numPlayers).fill(0)
    });
}
```

---

## Tap/Hold Gesture System

### The Core Mechanic (from EnergyTracker)

This is the **most important part** of a lifetap app.

### Gesture State

```javascript
const holdState = {};

function initHoldState(playerId) {
    holdState[playerId] = {
        interval: null,      // Repeating timer
        timeout: null,       // Initial delay
        speed: 150,          // Milliseconds between increments
        step: 1,             // Amount to change per tick
        isAggressive: false, // Fast mode after 2 seconds
        holdDuration: 200,   // Delay before hold starts
        aggressiveThreshold: 2000  // When to go aggressive
    };
}
```

### Event Listeners

```javascript
function setupTapHold(playerId) {
    const leftZone = document.getElementById(`tapLeft${playerId}`);
    const rightZone = document.getElementById(`tapRight${playerId}`);

    // LEFT ZONE - Decrease
    leftZone.addEventListener('click', (e) => {
        e.stopPropagation();
        changeLife(playerId, -1);
    });

    leftZone.addEventListener('mousedown', (e) => {
        e.stopPropagation();
        startHold(playerId, -1);
    });

    leftZone.addEventListener('mouseup', (e) => {
        stopHold(playerId);
    });

    // Mobile support
    leftZone.addEventListener('touchstart', (e) => {
        e.preventDefault();
        startHold(playerId, -1);
    });

    leftZone.addEventListener('touchend', (e) => {
        e.preventDefault();
        stopHold(playerId);
    });

    // Same for RIGHT ZONE with direction = +1
}
```

### Hold Acceleration

**This creates the "exponential" feel:**

```javascript
function startHold(playerId, direction) {
    const state = holdState[playerId];

    // Wait 200ms before starting to hold
    state.timeout = setTimeout(() => {

        const incrementFunc = () => {
            // Change life by step amount
            changeLife(playerId, direction * state.step);

            // ACCELERATE: Reduce delay between ticks
            if (!state.isAggressive) {
                // Normal mode: divide by 1.2 (down to 50ms min)
                state.speed = Math.max(state.speed / 1.2, 50);
            } else {
                // Aggressive mode: divide by 1.1 (down to 5ms min)
                state.speed = Math.max(state.speed / 1.1, 5);
            }

            // Super fast for high life totals
            if (gameState.players[playerId].life > 100) {
                state.speed = Math.max(state.speed / 1.05, 1);
            }

            // Restart interval with new (faster) speed
            clearInterval(state.interval);
            state.interval = setInterval(incrementFunc, state.speed);
        };

        // Start the interval
        state.interval = setInterval(incrementFunc, state.speed);

        // After 2 seconds, enter aggressive mode
        setTimeout(() => {
            state.isAggressive = true;
        }, state.aggressiveThreshold);

        // Increase step size over time
        setTimeout(() => { state.step = 10; }, 20000);    // After 20s
        setTimeout(() => { state.step = 100; }, 60000);   // After 1 min
        setTimeout(() => { state.step = 1000; }, 120000); // After 2 min

    }, state.holdDuration);
}
```

### Stop Hold

**Clean up all timers:**

```javascript
function stopHold(playerId) {
    const state = holdState[playerId];

    clearTimeout(state.timeout);
    clearInterval(state.interval);

    // Reset to defaults
    state.speed = 150;
    state.step = 1;
    state.isAggressive = false;
}
```

### Update Life

**Efficient DOM update (no full re-render):**

```javascript
function changeLife(playerId, amount) {
    gameState.players[playerId].life += amount;

    // Update just the number
    const lifeTotal = document.querySelector(`#lifeDisplay${playerId} .life-total`);
    if (lifeTotal) {
        lifeTotal.textContent = gameState.players[playerId].life;
    }

    // Check for death
    if (gameState.players[playerId].life <= 0) {
        // Show "DEAD" overlay
    }
}
```

---

## Mobile Optimization

### Critical Meta Tags

```html
<meta name="viewport" content="width=device-width, initial-scale=1.0, user-scalable=no">
<meta name="apple-mobile-web-app-capable" content="yes">
```

### Touch-Friendly Sizing

```css
.tap-zone {
    min-width: 150px;  /* Easy to hit with thumb */
    min-height: 200px;
}
```

### Prevent Text Selection

```css
body {
    user-select: none;
    -webkit-user-select: none;
    -webkit-tap-highlight-color: transparent;
}
```

### Active State Feedback

```css
.tap-left:active {
    background: rgba(231, 76, 60, 0.2);
}
```

---

## Commander Damage Tracking

### Data Structure

```javascript
player = {
    id: 0,
    life: 40,
    commanderDamage: [0, 0, 0, 0]  // Damage FROM each other player
}
```

### Modal UI

```javascript
function openDamageModal(receiverId) {
    // Show modal with grid of opponents
    gameState.players.forEach(dealer => {
        if (dealer.id === receiverId) return;

        const damage = player.commanderDamage[dealer.id];

        // Display:
        // [Opponent Name]
        // [-] [21] [+]
        //
        // Mark as LETHAL if damage >= 21
    });
}
```

---

## Testing & Deployment

### Local Testing

```bash
python app.py
# Open http://localhost:5000 on your phone
```

### Mobile Testing Tips

1. **Use Chrome DevTools** mobile emulation
2. **Test on real device** via local network
3. **Check landscape/portrait** both work
4. **Verify hold gestures** don't trigger scroll

### Deploy to Production

**Option 1: Heroku**
```bash
git push heroku main
```

**Option 2: PythonAnywhere**
- Upload files
- Configure WSGI

**Option 3: GitHub Pages + Static Export**
- Remove Flask
- Serve HTML directly

---

## Key Takeaways

### Must-Haves for Lifetap Apps

1. ✅ **Split tap zones** (left/right)
2. ✅ **Hold acceleration** (exponential speed increase)
3. ✅ **Visual feedback** (active states)
4. ✅ **Mobile-optimized** (large touch targets)
5. ✅ **Efficient updates** (no full re-renders)

### Common Pitfalls

❌ **Don't** use buttons instead of tap zones
❌ **Don't** forget `touchstart`/`touchend` for mobile
❌ **Don't** let text selection interfere
❌ **Don't** re-render entire UI on every life change

### Performance Tips

- Use `textContent` not `innerHTML` for updates
- Clear timers properly in `stopHold()`
- Use event delegation for dynamic elements
- Debounce rapid taps if needed

---

## Next Steps

### Enhancements

- **Sound effects** (button.mp3 on tap)
- **Haptic feedback** (`navigator.vibrate()`)
- **Theme customization** (dark mode, colors)
- **Game history** (undo/redo)
- **Stats tracking** (damage dealt, games won)

### Advanced Features

- **Multiplayer sync** (WebSockets)
- **Offline support** (Service Worker)
- **Screen wake lock** (prevent sleep during games)
- **Portrait lock** (force orientation)

---

## Full Code Example

Check the repository for complete working code:
- `app.py` - Flask server
- `templates/index.html` - HTML structure
- `static/css/style.css` - Complete styles
- `static/js/app.js` - Full game logic

**Run it:**
```bash
pip install -r requirements.txt
python app.py
```

Open on your tablet and enjoy! 🎮
