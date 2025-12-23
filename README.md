# MTG Commander Life Tracker

A mobile-optimized web app for tracking life totals and commander damage in Magic: The Gathering Commander games.

## Features

- **2-6 Player Support** - Track games with any number of players
- **Commander Damage Tracking** - Full support for the 21 commander damage rule
- **Life Total Management** - Easy +/- buttons for life changes
- **Mobile Optimized** - Touch-friendly interface for tablets and phones
- **Visual Warnings** - Color-coded alerts when players reach critical thresholds
- **Player Customization** - Rename players and assign colors

## Installation

1. Install Python 3.7+
2. Install dependencies:
```bash
pip install -r requirements.txt
```

## Running the App

```bash
python app.py
```

Then open your browser to `http://localhost:5000`

## Usage

1. **Setup**: Select number of players (2-6) and starting life total (20, 30, or 40)
2. **Track Life**: Tap the life total to add 1, or use the +/- buttons
3. **Commander Damage**: Click "Commander Damage" button to track damage from each opponent
4. **Player Names**: Click player names to customize them

## Commander Rules

- Starting life: 40 (default)
- Commander damage threshold: 21 from a single commander
- The app tracks both life total and commander damage separately

Perfect for casual Commander games at your local game store or kitchen table!
