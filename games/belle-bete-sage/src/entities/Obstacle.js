import { OBSTACLE_TYPES, COLLECTIBLES, LANES } from '../config.js';

/**
 * Classe pour les obstacles
 */
export class Obstacle {
  constructor(lane, type, large = false) {
    this.lane = lane;
    this.large = large;

    // Sélection aléatoire du type d'obstacle
    const types = large ? OBSTACLE_TYPES.large : OBSTACLE_TYPES.small;
    const obstacleType = types[Math.floor(Math.random() * types.length)];

    this.name = obstacleType.name;
    this.width = obstacleType.width;
    this.height = obstacleType.height;
    this.color = obstacleType.color;

    // Position initiale (hors écran en haut)
    this.y = -this.height;
    this.active = true;
  }

  /**
   * Met à jour la position de l'obstacle
   * @param {number} speed - Vitesse de défilement
   * @param {number} deltaTime - Temps écoulé
   */
  update(speed, deltaTime) {
    this.y += speed * 100 * (deltaTime / 1000);

    // Désactiver si sorti de l'écran
    if (this.y > 260) {
      this.active = false;
    }
  }

  /**
   * Vérifie la collision avec le joueur
   * @param {Object} player
   * @returns {boolean}
   */
  checkCollision(player) {
    if (this.lane !== player.lane) return false;

    const playerY = 180; // Position Y du joueur
    const playerHeight = 32;
    const playerWidth = 24;

    // Si le joueur saute, il évite les petits obstacles
    if (player.jumping && player.jumpProgress > 0.2 && player.jumpProgress < 0.8 && !this.large) {
      return false;
    }

    // Collision basique par boîte englobante
    const obstacleTop = this.y;
    const obstacleBottom = this.y + this.height;
    const playerTop = playerY;
    const playerBottom = playerY + playerHeight;

    return obstacleBottom > playerTop && obstacleTop < playerBottom;
  }
}

/**
 * Classe pour les pièces
 */
export class Coin {
  constructor(lane) {
    this.lane = lane;
    this.y = -20;
    this.size = COLLECTIBLES.coin.size;
    this.value = COLLECTIBLES.coin.value;
    this.active = true;
  }

  /**
   * Met à jour la position
   * @param {number} speed
   * @param {number} deltaTime
   */
  update(speed, deltaTime) {
    this.y += speed * 100 * (deltaTime / 1000);
    if (this.y > 260) {
      this.active = false;
    }
  }

  /**
   * Vérifie la collision avec le joueur
   * @param {Object} player
   * @returns {boolean}
   */
  checkCollision(player) {
    if (this.lane !== player.lane) return false;

    const playerY = 180;
    const distance = Math.abs(this.y - playerY);
    return distance < 30;
  }
}

/**
 * Classe pour les bonus
 */
export class Bonus {
  constructor(lane) {
    this.lane = lane;
    this.y = -20;
    this.size = COLLECTIBLES.bonus.size;
    this.baseValue = COLLECTIBLES.bonus.baseValue;
    this.active = true;
  }

  /**
   * Met à jour la position
   * @param {number} speed
   * @param {number} deltaTime
   */
  update(speed, deltaTime) {
    this.y += speed * 100 * (deltaTime / 1000);
    if (this.y > 260) {
      this.active = false;
    }
  }

  /**
   * Calcule la valeur du bonus selon la beauté
   * @param {number} beaute
   * @returns {number}
   */
  getValue(beaute) {
    return this.baseValue * beaute;
  }

  /**
   * Vérifie la collision avec le joueur
   * @param {Object} player
   * @returns {boolean}
   */
  checkCollision(player) {
    if (this.lane !== player.lane) return false;

    const playerY = 180;
    const distance = Math.abs(this.y - playerY);
    return distance < 30;
  }
}
