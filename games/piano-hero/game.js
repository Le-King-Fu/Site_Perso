// Piano Hero - A rhythm game
const canvas = document.getElementById('game-canvas');
const ctx = canvas.getContext('2d');

// Audio
let audioCtx = null;
let melodyInterval = null;
let melodyIndex = 0;

// Bonus image
const bonusImg = new Image();
bonusImg.src = 'Bonus.png';
const BONUS_CHANCE = 0.15; // 15% chance for bonus note

// Note frequencies (Hz)
const NOTE_FREQ = {
    'C': 261.63,
    'D': 293.66,
    'E': 329.63,
    'F': 349.23,
    'G': 392.00,
    'A': 440.00,
    'B': 493.88
};

// Simple melody pattern
const MELODY = ['C', 'E', 'G', 'E', 'C', 'E', 'G', 'A', 'G', 'E', 'D', 'E', 'F', 'E', 'D', 'C'];

// Game settings
const CANVAS_WIDTH = 600;
const CANVAS_HEIGHT = 400;
canvas.width = CANVAS_WIDTH;
canvas.height = CANVAS_HEIGHT;

// Note lanes (corresponding to piano keys)
const NOTES = ['C', 'D', 'E', 'F', 'G', 'A', 'B'];
const LANE_WIDTH = CANVAS_WIDTH / NOTES.length;
const NOTE_HEIGHT = 40;
const HIT_ZONE_Y = CANVAS_HEIGHT - 60;

// Level configurations: [noteSpeed, spawnInterval]
const LEVELS = [
    { speed: 1.5, spawnInterval: 1600, name: 'Beginner' },
    { speed: 2,   spawnInterval: 1300, name: 'Easy' },
    { speed: 2.5, spawnInterval: 1000, name: 'Medium' },
    { speed: 3,   spawnInterval: 800,  name: 'Hard' },
    { speed: 4,   spawnInterval: 600,  name: 'Expert' }
];

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
let highScore = 0;
let lastScore = 0;
let fallingNotes = [];
let lastNoteTime = 0;
let currentLevel = 0;
let noteSpeed = LEVELS[0].speed;
let spawnInterval = LEVELS[0].spawnInterval;

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

// Audio functions
function initAudio() {
    if (!audioCtx) {
        audioCtx = new (window.AudioContext || window.webkitAudioContext)();
    }
}

function playNote(frequency, duration = 0.3, volume = 0.1) {
    if (!audioCtx) return;

    const oscillator = audioCtx.createOscillator();
    const gainNode = audioCtx.createGain();

    oscillator.connect(gainNode);
    gainNode.connect(audioCtx.destination);

    oscillator.type = 'sine';
    oscillator.frequency.setValueAtTime(frequency, audioCtx.currentTime);

    gainNode.gain.setValueAtTime(volume, audioCtx.currentTime);
    gainNode.gain.exponentialRampToValueAtTime(0.01, audioCtx.currentTime + duration);

    oscillator.start(audioCtx.currentTime);
    oscillator.stop(audioCtx.currentTime + duration);
}

function playMelodyNote() {
    const note = MELODY[melodyIndex];
    playNote(NOTE_FREQ[note], 0.4, 0.05);
    melodyIndex = (melodyIndex + 1) % MELODY.length;
}

function startMelody() {
    melodyIndex = 0;
    // Play melody note every 400ms
    melodyInterval = setInterval(playMelodyNote, 400);
}

function stopMelody() {
    if (melodyInterval) {
        clearInterval(melodyInterval);
        melodyInterval = null;
    }
}

function playDiscordantSound() {
    if (!audioCtx) return;

    // Play multiple clashing frequencies for a harsh sound
    const dissonantFreqs = [110, 117, 123]; // Low, clashing frequencies

    dissonantFreqs.forEach((freq, i) => {
        const oscillator = audioCtx.createOscillator();
        const gainNode = audioCtx.createGain();

        oscillator.connect(gainNode);
        gainNode.connect(audioCtx.destination);

        oscillator.type = 'sawtooth';
        oscillator.frequency.setValueAtTime(freq, audioCtx.currentTime);

        gainNode.gain.setValueAtTime(0.15, audioCtx.currentTime);
        gainNode.gain.exponentialRampToValueAtTime(0.01, audioCtx.currentTime + 0.2);

        oscillator.start(audioCtx.currentTime);
        oscillator.stop(audioCtx.currentTime + 0.2);
    });
}

function playHitSound(note) {
    if (!audioCtx) return;
    playNote(NOTE_FREQ[note], 0.15, 0.2);
}

function playBonusSound() {
    if (!audioCtx) return;
    // Play a cheerful arpeggio for bonus
    playNote(523.25, 0.1, 0.15); // C5
    setTimeout(() => playNote(659.25, 0.1, 0.15), 50); // E5
    setTimeout(() => playNote(783.99, 0.15, 0.2), 100); // G5
}

// Initialize
function init() {
    createLevelSelector();
    setupPianoKeys();
    document.getElementById('start-btn').addEventListener('click', toggleGame);
    document.addEventListener('keydown', handleKeyDown);
    document.addEventListener('keyup', handleKeyUp);

    // Draw initial state
    draw();
}

function setupPianoKeys() {
    const keys = document.querySelectorAll('.key');

    keys.forEach(key => {
        const note = key.dataset.note;

        // Mouse events
        key.addEventListener('mousedown', (e) => {
            e.preventDefault();
            handlePianoKeyPress(note);
            key.classList.add('active');
        });

        key.addEventListener('mouseup', () => {
            key.classList.remove('active');
        });

        key.addEventListener('mouseleave', () => {
            key.classList.remove('active');
        });

        // Touch events for mobile
        key.addEventListener('touchstart', (e) => {
            e.preventDefault();
            handlePianoKeyPress(note);
            key.classList.add('active');
        });

        key.addEventListener('touchend', (e) => {
            e.preventDefault();
            key.classList.remove('active');
        });
    });
}

function handlePianoKeyPress(note) {
    if (!gameRunning) return;
    checkHit(note);
}

function createLevelSelector() {
    const levelSelector = document.getElementById('level-selector');
    if (!levelSelector) return;

    LEVELS.forEach((level, index) => {
        const btn = document.createElement('button');
        btn.className = 'level-btn' + (index === 0 ? ' active' : '');
        btn.textContent = (index + 1);
        btn.title = level.name;
        btn.addEventListener('click', () => selectLevel(index));
        levelSelector.appendChild(btn);
    });

    updateLevelDisplay();
}

function selectLevel(index) {
    if (gameRunning) return;

    currentLevel = index;
    noteSpeed = LEVELS[index].speed;
    spawnInterval = LEVELS[index].spawnInterval;

    // Update button states
    document.querySelectorAll('.level-btn').forEach((btn, i) => {
        btn.classList.toggle('active', i === index);
    });

    updateLevelDisplay();
}

function updateLevelDisplay() {
    const levelName = document.getElementById('level-name');
    if (levelName) {
        levelName.textContent = LEVELS[currentLevel].name;
    }
}

function startGame() {
    gameRunning = true;
    score = 0;
    fallingNotes = [];
    lastNoteTime = 0;
    updateScore();
    document.getElementById('start-btn').textContent = 'Stop';

    // Disable level selection during game
    document.querySelectorAll('.level-btn').forEach(btn => btn.disabled = true);

    // Start audio
    initAudio();
    startMelody();

    gameLoop();
}

function stopGame() {
    gameRunning = false;
    fallingNotes = [];

    // Stop audio
    stopMelody();

    // Save scores before resetting
    lastScore = score;
    if (score > highScore) {
        highScore = score;
    }
    updateScoreDisplay();

    score = 0;
    document.getElementById('start-btn').textContent = 'Start Game';

    // Re-enable level selection
    document.querySelectorAll('.level-btn').forEach(btn => btn.disabled = false);

    // Redraw to clear notes from canvas
    draw();
}

function toggleGame() {
    if (gameRunning) {
        stopGame();
    } else {
        startGame();
    }
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
    if (now - lastNoteTime > spawnInterval) {
        spawnNote();
        lastNoteTime = now;
    }

    // Move notes down
    for (let i = fallingNotes.length - 1; i >= 0; i--) {
        const note = fallingNotes[i];
        note.y += noteSpeed;

        // Remove notes that passed the bottom
        if (note.y > CANVAS_HEIGHT) {
            // Play discordant sound if note was missed
            if (!note.hit) {
                playDiscordantSound();
            }
            fallingNotes.splice(i, 1);
        }
    }
}

function spawnNote() {
    const noteIndex = Math.floor(Math.random() * NOTES.length);
    const isBonus = Math.random() < BONUS_CHANCE;
    fallingNotes.push({
        note: NOTES[noteIndex],
        lane: noteIndex,
        y: -NOTE_HEIGHT,
        hit: false,
        bonus: isBonus
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
        const noteWidth = LANE_WIDTH - 10;

        if (note.bonus && bonusImg.complete) {
            // Draw bonus image with pulsing/wobble animation
            if (note.hit) {
                ctx.globalAlpha = 0.5;
            }

            // Pulsing scale effect
            const pulse = 1 + Math.sin(Date.now() / 100) * 0.1;
            const wobble = Math.sin(Date.now() / 150) * 3;

            const scaledWidth = noteWidth * pulse;
            const scaledHeight = NOTE_HEIGHT * pulse;
            const offsetX = (noteWidth - scaledWidth) / 2;
            const offsetY = (NOTE_HEIGHT - scaledHeight) / 2;

            ctx.save();
            ctx.translate(x + noteWidth / 2, note.y + NOTE_HEIGHT / 2);
            ctx.rotate(Math.sin(Date.now() / 200) * 0.1);
            ctx.drawImage(bonusImg, -scaledWidth / 2 + wobble, -scaledHeight / 2, scaledWidth, scaledHeight);
            ctx.restore();

            ctx.globalAlpha = 1;
        } else {
            // Draw regular note
            ctx.fillStyle = note.hit ? '#22c55e' : LANE_COLORS[note.lane];
            ctx.beginPath();
            ctx.roundRect(x, note.y, noteWidth, NOTE_HEIGHT, 8);
            ctx.fill();

            // Note label
            ctx.fillStyle = '#fff';
            ctx.font = 'bold 16px sans-serif';
            ctx.textAlign = 'center';
            ctx.fillText(note.note, x + noteWidth / 2, note.y + NOTE_HEIGHT / 2 + 6);
        }
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

                // Bonus gives 3x score
                if (fallingNote.bonus) {
                    score += 300;
                    playBonusSound();
                } else {
                    score += 100;
                    playHitSound(note);
                }
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
    // Update high score in real-time if current score beats it
    if (score > highScore) {
        document.querySelector('#high-score span').textContent = score;
    }
}

function updateScoreDisplay() {
    document.querySelector('#score span').textContent = score;
    document.querySelector('#high-score span').textContent = highScore;
    document.querySelector('#last-score span').textContent = lastScore;
}

// Start when page loads
init();
