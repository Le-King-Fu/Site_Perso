// Piano Hero - A rhythm game
const canvas = document.getElementById('game-canvas');
const ctx = canvas.getContext('2d');

// Game settings
const CANVAS_WIDTH = 600;
const CANVAS_HEIGHT = 400;
canvas.width = CANVAS_WIDTH;
canvas.height = CANVAS_HEIGHT;

// Note lanes (corresponding to piano keys)
const NOTES = ['C', 'D', 'E', 'F', 'G', 'A', 'B'];
const LANE_WIDTH = CANVAS_WIDTH / NOTES.length;
const NOTE_HEIGHT = 40;
const NOTE_SPEED = 3;
const HIT_ZONE_Y = CANVAS_HEIGHT - 60;

// Keyboard mapping
const KEY_MAP = {
    'a': 'C',
    's': 'D',
    'd': 'E',
    'f': 'F',
    'g': 'G',
    'h': 'A',
    'j': 'B'
};

// Game state
let gameRunning = false;
let score = 0;
let fallingNotes = [];
let lastNoteTime = 0;

// Colors for each lane
const LANE_COLORS = [
    '#ef4444', // red
    '#f97316', // orange
    '#eab308', // yellow
    '#22c55e', // green
    '#3b82f6', // blue
    '#8b5cf6', // purple
    '#ec4899'  // pink
];

// Initialize
function init() {
    document.getElementById('start-btn').addEventListener('click', startGame);
    document.addEventListener('keydown', handleKeyDown);
    document.addEventListener('keyup', handleKeyUp);

    // Draw initial state
    draw();
}

function startGame() {
    gameRunning = true;
    score = 0;
    fallingNotes = [];
    updateScore();
    document.getElementById('start-btn').textContent = 'Playing...';
    document.getElementById('start-btn').disabled = true;
    gameLoop();
}

function gameLoop() {
    if (!gameRunning) return;

    update();
    draw();
    requestAnimationFrame(gameLoop);
}

function update() {
    // Spawn new notes
    const now = Date.now();
    if (now - lastNoteTime > 800) { // New note every 800ms
        spawnNote();
        lastNoteTime = now;
    }

    // Move notes down
    for (let i = fallingNotes.length - 1; i >= 0; i--) {
        const note = fallingNotes[i];
        note.y += NOTE_SPEED;

        // Remove notes that passed the bottom
        if (note.y > CANVAS_HEIGHT) {
            fallingNotes.splice(i, 1);
        }
    }
}

function spawnNote() {
    const noteIndex = Math.floor(Math.random() * NOTES.length);
    fallingNotes.push({
        note: NOTES[noteIndex],
        lane: noteIndex,
        y: -NOTE_HEIGHT,
        hit: false
    });
}

function draw() {
    // Clear canvas
    ctx.fillStyle = '#0f0f23';
    ctx.fillRect(0, 0, CANVAS_WIDTH, CANVAS_HEIGHT);

    // Draw lane lines
    ctx.strokeStyle = '#2a2a4a';
    for (let i = 1; i < NOTES.length; i++) {
        ctx.beginPath();
        ctx.moveTo(i * LANE_WIDTH, 0);
        ctx.lineTo(i * LANE_WIDTH, CANVAS_HEIGHT);
        ctx.stroke();
    }

    // Draw hit zone
    ctx.fillStyle = 'rgba(255, 255, 255, 0.1)';
    ctx.fillRect(0, HIT_ZONE_Y, CANVAS_WIDTH, 50);

    // Draw lane labels
    ctx.fillStyle = 'rgba(255, 255, 255, 0.3)';
    ctx.font = '14px monospace';
    ctx.textAlign = 'center';
    const keys = Object.keys(KEY_MAP);
    for (let i = 0; i < NOTES.length; i++) {
        ctx.fillText(keys[i].toUpperCase(), i * LANE_WIDTH + LANE_WIDTH / 2, HIT_ZONE_Y + 35);
    }

    // Draw falling notes
    for (const note of fallingNotes) {
        const x = note.lane * LANE_WIDTH + 5;
        ctx.fillStyle = note.hit ? '#22c55e' : LANE_COLORS[note.lane];
        ctx.beginPath();
        ctx.roundRect(x, note.y, LANE_WIDTH - 10, NOTE_HEIGHT, 8);
        ctx.fill();

        // Note label
        ctx.fillStyle = '#fff';
        ctx.font = 'bold 16px sans-serif';
        ctx.textAlign = 'center';
        ctx.fillText(note.note, x + (LANE_WIDTH - 10) / 2, note.y + NOTE_HEIGHT / 2 + 6);
    }
}

function handleKeyDown(e) {
    if (!gameRunning) return;

    const note = KEY_MAP[e.key.toLowerCase()];
    if (!note) return;

    // Highlight piano key
    const keyEl = document.querySelector(`.key[data-note="${note}"]`);
    if (keyEl) keyEl.classList.add('active');

    // Check for hit
    checkHit(note);
}

function handleKeyUp(e) {
    const note = KEY_MAP[e.key.toLowerCase()];
    if (!note) return;

    const keyEl = document.querySelector(`.key[data-note="${note}"]`);
    if (keyEl) keyEl.classList.remove('active');
}

function checkHit(note) {
    for (const fallingNote of fallingNotes) {
        if (fallingNote.note === note && !fallingNote.hit) {
            // Check if note is in hit zone
            if (fallingNote.y >= HIT_ZONE_Y - 30 && fallingNote.y <= HIT_ZONE_Y + 50) {
                fallingNote.hit = true;
                score += 100;
                updateScore();

                // Visual feedback on piano key
                const keyEl = document.querySelector(`.key[data-note="${note}"]`);
                if (keyEl) {
                    keyEl.classList.add('hit');
                    setTimeout(() => keyEl.classList.remove('hit'), 200);
                }
                return;
            }
        }
    }
}

function updateScore() {
    document.querySelector('#score span').textContent = score;
}

// Start when page loads
init();
