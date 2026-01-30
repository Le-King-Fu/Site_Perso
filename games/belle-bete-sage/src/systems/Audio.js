/**
 * Système audio 8-bit avec Web Audio API
 */
export class Audio {
  constructor() {
    this.ctx = null;
    this.muted = false;
  }

  /**
   * Initialise le contexte audio
   */
  init() {
    if (!this.ctx) {
      this.ctx = new (window.AudioContext || window.webkitAudioContext)();
    }
    if (this.ctx.state === 'suspended') {
      this.ctx.resume();
    }
  }

  /**
   * Joue une note 8-bit
   * @param {number} frequency - Fréquence en Hz
   * @param {number} duration - Durée en secondes
   * @param {string} type - Type d'onde (square, sawtooth, triangle)
   */
  playTone(frequency, duration = 0.1, type = 'square') {
    if (this.muted || !this.ctx) return;

    const oscillator = this.ctx.createOscillator();
    const gainNode = this.ctx.createGain();

    oscillator.connect(gainNode);
    gainNode.connect(this.ctx.destination);

    oscillator.type = type;
    oscillator.frequency.value = frequency;

    gainNode.gain.setValueAtTime(0.3, this.ctx.currentTime);
    gainNode.gain.exponentialRampToValueAtTime(0.01, this.ctx.currentTime + duration);

    oscillator.start(this.ctx.currentTime);
    oscillator.stop(this.ctx.currentTime + duration);
  }

  /**
   * Son de saut
   */
  playJump() {
    this.playTone(200, 0.1);
    setTimeout(() => this.playTone(300, 0.1), 50);
  }

  /**
   * Son de pièce collectée
   */
  playCoin() {
    this.playTone(880, 0.08);
    setTimeout(() => this.playTone(1320, 0.15), 80);
  }

  /**
   * Son de bonus collecté
   */
  playBonus() {
    this.playTone(440, 0.1);
    setTimeout(() => this.playTone(660, 0.1), 100);
    setTimeout(() => this.playTone(880, 0.15), 200);
  }

  /**
   * Son de collision
   */
  playHit() {
    this.playTone(100, 0.2, 'sawtooth');
  }

  /**
   * Son de game over
   */
  playGameOver() {
    this.playTone(400, 0.2);
    setTimeout(() => this.playTone(300, 0.2), 200);
    setTimeout(() => this.playTone(200, 0.4), 400);
  }

  /**
   * Son de level up
   */
  playLevelUp() {
    const notes = [523, 659, 784, 1047];
    notes.forEach((freq, i) => {
      setTimeout(() => this.playTone(freq, 0.15), i * 100);
    });
  }

  /**
   * Son de changement de voie
   */
  playLaneChange() {
    this.playTone(440, 0.05);
  }

  /**
   * Active/désactive le son
   */
  toggleMute() {
    this.muted = !this.muted;
    return this.muted;
  }
}
