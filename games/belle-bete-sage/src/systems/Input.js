import { KEYS } from '../config.js';

/**
 * Système de gestion des entrées clavier et tactile
 */
export class Input {
  constructor() {
    this.keys = {};
    this.touchStartX = null;
    this.touchStartY = null;
    this.callbacks = {
      left: null,
      right: null,
      jump: null,
      pause: null
    };
  }

  /**
   * Initialise les écouteurs d'événements
   */
  init() {
    // Clavier
    window.addEventListener('keydown', (e) => this.handleKeyDown(e));
    window.addEventListener('keyup', (e) => this.handleKeyUp(e));

    // Tactile
    window.addEventListener('touchstart', (e) => this.handleTouchStart(e));
    window.addEventListener('touchend', (e) => this.handleTouchEnd(e));
  }

  /**
   * Enregistre les callbacks pour les actions
   * @param {Object} callbacks
   */
  setCallbacks(callbacks) {
    this.callbacks = { ...this.callbacks, ...callbacks };
  }

  /**
   * Gestion de l'appui sur une touche
   * @param {KeyboardEvent} e
   */
  handleKeyDown(e) {
    const code = e.code;
    if (this.keys[code]) return; // Évite les répétitions

    this.keys[code] = true;

    // Gauche
    if (KEYS.LEFT.includes(code) && this.callbacks.left) {
      e.preventDefault();
      this.callbacks.left();
    }
    // Droite
    else if (KEYS.RIGHT.includes(code) && this.callbacks.right) {
      e.preventDefault();
      this.callbacks.right();
    }
    // Saut
    else if (KEYS.JUMP.includes(code) && this.callbacks.jump) {
      e.preventDefault();
      this.callbacks.jump();
    }
    // Pause
    else if (KEYS.PAUSE.includes(code) && this.callbacks.pause) {
      e.preventDefault();
      this.callbacks.pause();
    }
  }

  /**
   * Gestion du relâchement d'une touche
   * @param {KeyboardEvent} e
   */
  handleKeyUp(e) {
    this.keys[e.code] = false;
  }

  /**
   * Gestion du début du toucher
   * @param {TouchEvent} e
   */
  handleTouchStart(e) {
    if (e.touches.length > 0) {
      this.touchStartX = e.touches[0].clientX;
      this.touchStartY = e.touches[0].clientY;
    }
  }

  /**
   * Gestion de la fin du toucher
   * @param {TouchEvent} e
   */
  handleTouchEnd(e) {
    if (this.touchStartX === null) return;

    const touch = e.changedTouches[0];
    const deltaX = touch.clientX - this.touchStartX;
    const deltaY = touch.clientY - this.touchStartY;

    const threshold = 30;

    // Swipe horizontal
    if (Math.abs(deltaX) > Math.abs(deltaY)) {
      if (deltaX > threshold && this.callbacks.right) {
        this.callbacks.right();
      } else if (deltaX < -threshold && this.callbacks.left) {
        this.callbacks.left();
      }
    }
    // Swipe vertical (saut)
    else if (deltaY < -threshold && this.callbacks.jump) {
      this.callbacks.jump();
    }

    // Tap = saut
    if (Math.abs(deltaX) < 10 && Math.abs(deltaY) < 10 && this.callbacks.jump) {
      this.callbacks.jump();
    }

    this.touchStartX = null;
    this.touchStartY = null;
  }

  /**
   * Vérifie si une touche est actuellement pressée
   * @param {string} code
   * @returns {boolean}
   */
  isPressed(code) {
    return !!this.keys[code];
  }
}
