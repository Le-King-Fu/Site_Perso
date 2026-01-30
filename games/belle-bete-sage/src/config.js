/**
 * Configuration globale du jeu
 */

// Couleurs cyberpunk/neon
export const COLORS = {
  BG: '#1a1a2e',
  BG_SECONDARY: '#16213e',
  BG_DARK: '#0f3460',
  PRIMARY: '#ff6b35',
  PRIMARY_DARK: '#e55a2b',
  SECONDARY: '#00ff88',
  ACCENT: '#ff6b6b',
  COIN: '#ffcc00',
  TEXT: '#888888',
  WHITE: '#ffffff'
};

// Configuration du canvas
export const CANVAS = {
  WIDTH: 640,
  HEIGHT: 480,
  NATIVE_WIDTH: 320,
  NATIVE_HEIGHT: 240
};

// Configuration des voies
export const LANES = {
  COUNT: 3,
  WIDTH: 80,
  POSITIONS: [80, 160, 240] // Positions X des 3 voies (sur 320px natif)
};

// Personnages
export const CHARACTERS = {
  flora: {
    name: 'Flora',
    breed: 'Berger Allemand',
    force: 3,
    vitesse: 4,
    beaute: 5,
    color: '#d4a574',
    colorDark: '#c4956a'
  },
  nouki: {
    name: 'Nouki',
    breed: 'Labrador Dépeigné',
    force: 5,
    vitesse: 3,
    beaute: 4,
    color: '#f0d9b5',
    colorDark: '#e5c9a0'
  },
  laska: {
    name: 'Laska',
    breed: 'Berger Australien',
    force: 3,
    vitesse: 5,
    beaute: 4,
    color: '#4a4a4a',
    colorDark: '#7a5c3a'
  }
};

// Niveaux de difficulté
export const LEVELS = [
  { name: 'DÉBUTANT', speed: 0.8, spawnInterval: 1600 },
  { name: 'FACILE', speed: 1.0, spawnInterval: 1300 },
  { name: 'MOYEN', speed: 1.3, spawnInterval: 1000 },
  { name: 'DIFFICILE', speed: 1.6, spawnInterval: 800 },
  { name: 'EXPERT', speed: 2.0, spawnInterval: 600 }
];

// Points pour level up
export const LEVEL_UP_SCORE = 2000;

// Types d'obstacles
export const OBSTACLE_TYPES = {
  small: [
    { name: 'poubelle', width: 20, height: 24, color: '#555555' },
    { name: 'cone', width: 16, height: 20, color: '#ff6b00' },
    { name: 'chat', width: 18, height: 16, color: '#333333' },
    { name: 'rat', width: 14, height: 10, color: '#8b7355' }
  ],
  large: [
    { name: 'voiture', width: 50, height: 30, color: '#cc3333' },
    { name: 'moto', width: 35, height: 25, color: '#4444aa' },
    { name: 'vache', width: 45, height: 35, color: '#f5f5dc' }
  ]
};

// Pièces et bonus
export const COLLECTIBLES = {
  coin: { value: 100, color: COLORS.COIN, size: 12 },
  bonus: { baseValue: 500, color: COLORS.SECONDARY, size: 16 }
};

// Configuration du joueur
export const PLAYER = {
  WIDTH: 24,
  HEIGHT: 32,
  Y_POSITION: 180, // Position Y du joueur (proche du bas)
  JUMP_HEIGHT: 50,
  JUMP_DURATION: 500 // ms
};

// Touches de contrôle
export const KEYS = {
  LEFT: ['ArrowLeft', 'KeyA'],
  RIGHT: ['ArrowRight', 'KeyD'],
  JUMP: ['Space', 'ArrowUp', 'KeyW'],
  PAUSE: ['Escape', 'KeyP']
};
