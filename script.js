const canvas = document.getElementById('tetris');
const context = canvas.getContext('2d');
const nextCanvas = document.getElementById('next');
const nextContext = nextCanvas.getContext('2d');

context.scale(20, 20);
nextContext.scale(20, 20);

// Game Constants
const COLS = 12;
const ROWS = 20;
const BLOCK_SIZE = 20; // Scaled by context

// Colors for the pieces
const COLORS = [
    null,
    '#FF0D72', // T - Magenta
    '#0DC2FF', // O - Cyan
    '#0DFF72', // L - Green
    '#F538FF', // J - Purple
    '#FF8E0D', // I - Orange
    '#FFE138', // S - Yellow
    '#3877FF', // Z - Blue
];

// Tetromino shapes
const PIECES = [
    [
        [0, 0, 0],
        [1, 1, 1],
        [0, 1, 0],
    ],
    [
        [2, 2],
        [2, 2],
    ],
    [
        [0, 3, 0],
        [0, 3, 0],
        [0, 3, 3],
    ],
    [
        [0, 4, 0],
        [0, 4, 0],
        [4, 4, 0],
    ],
    [
        [0, 5, 0, 0],
        [0, 5, 0, 0],
        [0, 5, 0, 0],
        [0, 5, 0, 0],
    ],
    [
        [0, 6, 6],
        [6, 6, 0],
        [0, 0, 0],
    ],
    [
        [7, 7, 0],
        [0, 7, 7],
        [0, 0, 0],
    ],
];

// Game State
let dropCounter = 0;
let dropInterval = 1000;
let lastTime = 0;
let score = 0;
let level = 1;
let lines = 0;
let isPaused = false;
let isGameOver = false;
let requestID = null;

const arena = createMatrix(COLS, ROWS);

const player = {
    pos: {x: 0, y: 0},
    matrix: null,
    score: 0,
    next: null,
};

// Helper Functions
function createMatrix(w, h) {
    const matrix = [];
    while (h--) {
        matrix.push(new Array(w).fill(0));
    }
    return matrix;
}

function createPiece(type) {
    if (type === 'I') {
        return [
            [0, 1, 0, 0],
            [0, 1, 0, 0],
            [0, 1, 0, 0],
            [0, 1, 0, 0],
        ];
    } else if (type === 'L') {
        return [
            [0, 2, 0],
            [0, 2, 0],
            [0, 2, 2],
        ];
    } else if (type === 'J') {
        return [
            [0, 3, 0],
            [0, 3, 0],
            [3, 3, 0],
        ];
    } else if (type === 'O') {
        return [
            [4, 4],
            [4, 4],
        ];
    } else if (type === 'Z') {
        return [
            [5, 5, 0],
            [0, 5, 5],
            [0, 0, 0],
        ];
    } else if (type === 'S') {
        return [
            [0, 6, 6],
            [6, 6, 0],
            [0, 0, 0],
        ];
    } else if (type === 'T') {
        return [
            [0, 7, 0],
            [7, 7, 7],
            [0, 0, 0],
        ];
    }
}

// Using a randomizer that is slightly more balanced or just random
function getRandomPiece() {
    const pieces = 'ILJOTSZ';
    return createPiece(pieces[pieces.length * Math.random() | 0]);
}

function drawMatrix(matrix, offset, ctx = context) {
    matrix.forEach((row, y) => {
        row.forEach((value, x) => {
            if (value !== 0) {
                // Draw the block
                ctx.fillStyle = COLORS[value];
                ctx.fillRect(x + offset.x, y + offset.y, 1, 1);
                
                // Add a slight bevel/highlight effect for "premium" look
                ctx.lineWidth = 0.05;
                ctx.strokeStyle = 'rgba(255, 255, 255, 0.5)';
                ctx.strokeRect(x + offset.x, y + offset.y, 1, 1);

                // Inner shadow
                ctx.fillStyle = 'rgba(0, 0, 0, 0.1)';
                ctx.fillRect(x + offset.x + 0.1, y + offset.y + 0.8, 0.8, 0.1);
                ctx.fillRect(x + offset.x + 0.8, y + offset.y + 0.1, 0.1, 0.8);
            }
        });
    });
}

function draw() {
    // Clear main canvas
    context.fillStyle = '#000';
    context.fillRect(0, 0, canvas.width, canvas.height);

    drawMatrix(arena, {x: 0, y: 0});
    drawMatrix(player.matrix, player.pos);
}

function drawNext() {
    nextContext.fillStyle = '#000'; // Clear with background
    nextContext.clearRect(0, 0, nextCanvas.width, nextCanvas.height);
    
    // Center the piece in the next canvas (5x5 grid approx)
    const offset = {
        x: (5 - player.next[0].length) / 2,
        y: (5 - player.next.length) / 2,
    };
    drawMatrix(player.next, offset, nextContext);
}

function merge(arena, player) {
    player.matrix.forEach((row, y) => {
        row.forEach((value, x) => {
            if (value !== 0) {
                arena[y + player.pos.y][x + player.pos.x] = value;
            }
        });
    });
}

function rotate(matrix, dir) {
    for (let y = 0; y < matrix.length; ++y) {
        for (let x = 0; x < y; ++x) {
            [
                matrix[x][y],
                matrix[y][x],
            ] = [
                matrix[y][x],
                matrix[x][y],
            ];
        }
    }

    if (dir > 0) {
        matrix.forEach(row => row.reverse());
    } else {
        matrix.reverse();
    }
}

function playerDrop() {
    player.pos.y++;
    if (collide(arena, player)) {
        player.pos.y--;
        merge(arena, player);
        playerReset();
        arenaSweep();
        updateScore();
    }
    dropCounter = 0;
}

function playerMove(dir) {
    player.pos.x += dir;
    if (collide(arena, player)) {
        player.pos.x -= dir;
    }
}

function playerRotate(dir) {
    const pos = player.pos.x;
    let offset = 1;
    rotate(player.matrix, dir);
    while (collide(arena, player)) {
        player.pos.x += offset;
        offset = -(offset + (offset > 0 ? 1 : -1));
        if (offset > player.matrix[0].length) {
            rotate(player.matrix, -dir);
            player.pos.x = pos;
            return;
        }
    }
}

function playerReset() {
    if (player.next === null) {
        player.next = getRandomPiece();
    }
    player.matrix = player.next;
    player.next = getRandomPiece();
    player.pos.y = 0;
    player.pos.x = (arena[0].length / 2 | 0) -
                   (player.matrix[0].length / 2 | 0);
    
    drawNext();

    if (collide(arena, player)) {
        gameOver();
    }
}

function collide(arena, player) {
    const [m, o] = [player.matrix, player.pos];
    for (let y = 0; y < m.length; ++y) {
        for (let x = 0; x < m[y].length; ++x) {
            if (m[y][x] !== 0 &&
               (arena[y + o.y] &&
                arena[y + o.y][x + o.x]) !== 0) {
                return true;
            }
        }
    }
    return false;
}

function arenaSweep() {
    let rowCount = 0;
    outer: for (let y = arena.length - 1; y > 0; --y) {
        for (let x = 0; x < arena[y].length; ++x) {
            if (arena[y][x] === 0) {
                continue outer;
            }
        }

        const row = arena.splice(y, 1)[0].fill(0);
        arena.unshift(row);
        ++y;

        rowCount++;
    }

    if (rowCount > 0) {
        // Scoring: 100, 300, 500, 800
        const lineScores = [0, 100, 300, 500, 800];
        score += lineScores[rowCount] * level;
        lines += rowCount;
        level = Math.floor(lines / 10) + 1;
        dropInterval = Math.max(100, 1000 - (level - 1) * 50); // Speed up
    }
}

function updateScore() {
    document.getElementById('score').innerText = score;
    document.getElementById('level').innerText = level;
    document.getElementById('lines').innerText = lines;
}

function update(time = 0) {
    if (isPaused || isGameOver) return;

    const deltaTime = time - lastTime;
    lastTime = time;

    dropCounter += deltaTime;
    if (dropCounter > dropInterval) {
        playerDrop();
    }

    draw();
    requestID = requestAnimationFrame(update);
}

function gameOver() {
    isGameOver = true;
    cancelAnimationFrame(requestID);
    document.getElementById('game-over').classList.remove('hidden');
    document.getElementById('final-score').innerText = score;
}

function resetGame() {
    arena.forEach(row => row.fill(0));
    score = 0;
    level = 1;
    lines = 0;
    dropInterval = 1000;
    updateScore();
    isGameOver = false;
    isPaused = false;
    document.getElementById('game-over').classList.add('hidden');
    document.getElementById('pause-screen').classList.add('hidden');
    player.next = null; // Reset next piece
    playerReset();
    update();
}

function togglePause() {
    if (isGameOver) return;
    isPaused = !isPaused;
    const pauseScreen = document.getElementById('pause-screen');
    if (isPaused) {
        pauseScreen.classList.remove('hidden');
        cancelAnimationFrame(requestID);
    } else {
        pauseScreen.classList.add('hidden');
        lastTime = performance.now(); // Reset time to prevent jump
        update();
    }
}

// Event Listeners
document.addEventListener('keydown', event => {
    if (isGameOver) return;

    if (event.keyCode === 37) { // Left
        if (!isPaused) playerMove(-1);
    } else if (event.keyCode === 39) { // Right
        if (!isPaused) playerMove(1);
    } else if (event.keyCode === 40) { // Down
        if (!isPaused) playerDrop();
    } else if (event.keyCode === 81) { // Q - Rotate Left
        if (!isPaused) playerRotate(-1);
    } else if (event.keyCode === 38 || event.keyCode === 87) { // Up or W - Rotate Right
        if (!isPaused) playerRotate(1);
    } else if (event.keyCode === 80) { // P - Pause
        togglePause();
    } else if (event.keyCode === 32) { // Space - Hard Drop
        if (!isPaused) {
            while (!collide(arena, player)) {
                player.pos.y++;
            }
            player.pos.y--; // Back up one step
            merge(arena, player);
            playerReset();
            arenaSweep();
            updateScore();
            dropCounter = 0; // Reset drop counter
        }
    }
});

document.getElementById('start-btn').addEventListener('click', () => {
    if (isGameOver || !requestID) {
        resetGame();
    } else if (isPaused) {
        togglePause();
    }
});

document.getElementById('restart-btn').addEventListener('click', resetGame);
document.getElementById('resume-btn').addEventListener('click', togglePause);

// Initial Start
playerReset();
updateScore();
draw();
