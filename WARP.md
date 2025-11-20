# WARP.md

This file provides guidance to WARP (warp.dev) when working with code in this repository.

## Project Overview

A web-based Tetris game implementation using vanilla HTML5, CSS3, and JavaScript. The game features a modern neon-themed UI with classic Tetris mechanics including piece rotation, line clearing, scoring, and level progression.

## Running the Game

Open `index.html` directly in a web browser:
```bash
open index.html  # macOS
```

Or use a local server for development:
```bash
python3 -m http.server 8000
# Then visit http://localhost:8000
```

## Architecture

### File Structure
- `index.html` - Main game page with three sections: game info panel (left), game canvas (center), and next piece/controls panel (right)
- `script.js` - Game logic and state management
- `style.css` - Neon-themed styling with CSS variables and responsive design
- `images/` - Game assets

### Core Game Components

**Game State** (`script.js` lines 66-83)
- `arena` - 12x20 grid representing the game board
- `player` - Contains current piece position, matrix, and next piece
- Game variables: `score`, `level`, `lines`, `isPaused`, `isGameOver`
- Animation loop managed via `requestAnimationFrame`

**Tetromino System** (`script.js` lines 27-63, 94-144)
- 7 piece types: T, O, L, J, I, S, Z
- Each piece is a 2D matrix where non-zero values indicate filled cells
- Values 1-7 map to colors in the `COLORS` array
- Random piece generation uses `getRandomPiece()`

**Collision Detection** (`script.js` lines 270-282)
- `collide()` checks if player piece overlaps with arena boundaries or existing pieces
- Used for movement validation, rotation, and game over detection

**Core Game Loop** (`script.js` lines 316-329)
- Delta-time based dropping mechanism
- `dropInterval` decreases as level increases (faster gameplay)
- Runs via `requestAnimationFrame` with pause/game-over checks

**Rendering** (`script.js` lines 146-187)
- Canvas scaled to 20x20 blocks with `context.scale(20, 20)`
- Main canvas: 12 cols × 20 rows (240px × 400px)
- Next piece preview on separate 5×5 canvas
- Blocks drawn with neon colors, white highlight borders, and shadow effects

### Scoring System (`script.js` lines 284-308)
- Line clears: 1 line = 100pts, 2 = 300pts, 3 = 500pts, 4 = 800pts
- Score multiplied by current level
- Level increases every 10 lines cleared
- Drop speed increases by 50ms per level (minimum 100ms)

### Controls (`script.js` lines 369-408)
Keyboard mappings:
- Arrow Left (37): Move left
- Arrow Right (39): Move right
- Arrow Down (40): Soft drop
- Arrow Up (38) / W (87): Rotate clockwise
- Q (81): Rotate counter-clockwise
- Space (32): Hard drop
- P (80): Pause/resume

## Development Patterns

### Canvas Coordinate System
The canvas uses a scaled coordinate system where 1 unit = 20 pixels. When drawing, use logical coordinates (0-12 for x, 0-20 for y) rather than pixel coordinates. The `context.scale(20, 20)` call handles the transformation.

### Matrix Operations
- Pieces are 2D arrays with values representing block types
- `rotate()` performs in-place matrix transposition and reversal
- Collision detection happens before merging pieces to arena
- Wall kicks are implemented during rotation via offset adjustment

### State Management
- Game state changes trigger UI updates via `updateScore()`
- Overlays (game over, pause) managed through CSS classes
- Animation loop pauses on `isPaused` or `isGameOver` flags
- Reset via `resetGame()` which clears arena and reinitializes state

### Styling Architecture
CSS variables in `:root` define the color scheme:
- `--bg-color`: Main background (#0a0a12)
- `--panel-bg`: Semi-transparent panels
- `--accent-color`: Neon accent color (#00f0ff)
- Modern glassmorphism effects via `backdrop-filter: blur()`

## Code Modification Guidelines

### Adding New Piece Types
1. Add shape matrix to `PIECES` array (increment numbers)
2. Add corresponding color to `COLORS` array
3. Add case to `createPiece()` function
4. Update `getRandomPiece()` pieces string

### Modifying Game Difficulty
Adjust in `arenaSweep()` (line 306):
- Change `dropInterval` calculation for speed progression
- Modify line score multipliers in `lineScores` array
- Adjust level threshold (currently 10 lines per level)

### Canvas Rendering Changes
When modifying rendering in `drawMatrix()`:
- Remember the 20x scale factor
- Coordinates are in logical units, not pixels
- Use `ctx` parameter to support both main and next canvas
- Preserve block effects (borders, shadows) for visual consistency

### UI State Transitions
When adding new game states:
1. Add state boolean to game state section
2. Add overlay HTML to `index.html`
3. Check state in `update()` loop
4. Create toggle/transition function
5. Add corresponding CSS with `.hidden` class management
