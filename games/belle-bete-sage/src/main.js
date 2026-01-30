/**
 * La Belle, la Bête et la Sage
 * Point d'entrée du jeu
 */

import { Game } from './game.js';

// Initialisation au chargement de la page
window.addEventListener('DOMContentLoaded', () => {
  const canvas = document.getElementById('game-canvas');

  if (!canvas) {
    console.error('Canvas non trouvé!');
    return;
  }

  // Créer l'instance du jeu
  const game = new Game(canvas);

  // Debug: exposer le jeu globalement
  window.game = game;

  console.log('🐕 La Belle, la Bête et la Sage - Prêt!');
});
