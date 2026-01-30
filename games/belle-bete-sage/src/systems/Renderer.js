import { COLORS, CANVAS, LANES, PLAYER } from '../config.js';

/**
 * Système de rendu canvas avec effets néon
 */
export class Renderer {
  constructor(canvas) {
    this.canvas = canvas;
    this.ctx = canvas.getContext('2d');
    this.canvas.width = CANVAS.WIDTH;
    this.canvas.height = CANVAS.HEIGHT;

    // Scale pour le pixel art
    this.scale = CANVAS.WIDTH / CANVAS.NATIVE_WIDTH;

    // Animation du fond
    this.bgOffset = 0;
  }

  /**
   * Efface le canvas
   */
  clear() {
    this.ctx.fillStyle = COLORS.BG;
    this.ctx.fillRect(0, 0, CANVAS.WIDTH, CANVAS.HEIGHT);
  }

  /**
   * Dessine le fond de ruelle avec défilement
   * @param {number} speed - Vitesse de défilement
   */
  drawBackground(speed) {
    const ctx = this.ctx;
    const s = this.scale;

    // Fond principal - ciel nocturne
    const gradient = ctx.createLinearGradient(0, 0, 0, CANVAS.HEIGHT);
    gradient.addColorStop(0, COLORS.BG);
    gradient.addColorStop(1, COLORS.BG_SECONDARY);
    ctx.fillStyle = gradient;
    ctx.fillRect(0, 0, CANVAS.WIDTH, CANVAS.HEIGHT);

    // Animation du sol
    this.bgOffset = (this.bgOffset + speed * 2) % (40 * s);

    // Sol avec lignes de perspective
    ctx.fillStyle = COLORS.BG_DARK;
    ctx.fillRect(0, CANVAS.HEIGHT - 60 * s, CANVAS.WIDTH, 60 * s);

    // Lignes de la route
    ctx.strokeStyle = COLORS.PRIMARY;
    ctx.lineWidth = 2;
    ctx.setLineDash([20, 20]);
    ctx.lineDashOffset = -this.bgOffset;

    // Séparateurs de voies
    for (let i = 1; i < LANES.COUNT; i++) {
      const x = (LANES.POSITIONS[i - 1] + LANES.POSITIONS[i]) / 2 * s;
      ctx.beginPath();
      ctx.moveTo(x, CANVAS.HEIGHT - 60 * s);
      ctx.lineTo(x, CANVAS.HEIGHT);
      ctx.stroke();
    }

    ctx.setLineDash([]);

    // Bâtiments en arrière-plan (silhouettes)
    ctx.fillStyle = '#0a0a1a';
    this.drawBuildings(ctx, s);

    // Effet de brume néon
    const glowGradient = ctx.createLinearGradient(0, CANVAS.HEIGHT - 100 * s, 0, CANVAS.HEIGHT);
    glowGradient.addColorStop(0, 'rgba(255, 107, 53, 0)');
    glowGradient.addColorStop(1, 'rgba(255, 107, 53, 0.1)');
    ctx.fillStyle = glowGradient;
    ctx.fillRect(0, CANVAS.HEIGHT - 100 * s, CANVAS.WIDTH, 100 * s);
  }

  /**
   * Dessine les bâtiments en arrière-plan
   */
  drawBuildings(ctx, s) {
    const buildings = [
      { x: 0, w: 60, h: 120 },
      { x: 50, w: 40, h: 80 },
      { x: 100, w: 50, h: 140 },
      { x: 160, w: 45, h: 100 },
      { x: 220, w: 55, h: 130 },
      { x: 280, w: 40, h: 90 }
    ];

    buildings.forEach(b => {
      ctx.fillRect(b.x * s, CANVAS.HEIGHT - 60 * s - b.h * s, b.w * s, b.h * s);

      // Fenêtres lumineuses
      ctx.fillStyle = Math.random() > 0.7 ? COLORS.COIN : '#1a1a2e';
      for (let wy = 0; wy < b.h - 20; wy += 15) {
        for (let wx = 5; wx < b.w - 10; wx += 12) {
          if (Math.random() > 0.5) {
            ctx.fillStyle = Math.random() > 0.5 ? 'rgba(255, 204, 0, 0.5)' : 'rgba(0, 255, 136, 0.3)';
            ctx.fillRect((b.x + wx) * s, CANVAS.HEIGHT - 60 * s - b.h * s + wy * s, 6 * s, 8 * s);
          }
        }
      }
      ctx.fillStyle = '#0a0a1a';
    });
  }

  /**
   * Dessine le joueur (chien pixel art)
   * @param {Object} player - État du joueur
   * @param {Object} character - Configuration du personnage
   */
  drawPlayer(player, character) {
    const ctx = this.ctx;
    const s = this.scale;
    const x = LANES.POSITIONS[player.lane] * s - (PLAYER.WIDTH * s) / 2;
    let y = PLAYER.Y_POSITION * s;

    // Appliquer le saut
    if (player.jumping) {
      const jumpProgress = player.jumpProgress;
      const jumpHeight = PLAYER.JUMP_HEIGHT * s * Math.sin(jumpProgress * Math.PI);
      y -= jumpHeight;
    }

    // Corps du chien (pixel art simplifié)
    const w = PLAYER.WIDTH * s;
    const h = PLAYER.HEIGHT * s;

    // Ombre
    ctx.fillStyle = 'rgba(0, 0, 0, 0.3)';
    ctx.fillRect(x + 4, PLAYER.Y_POSITION * s + h - 4, w - 8, 8);

    // Corps
    ctx.fillStyle = character.color;
    ctx.fillRect(x + 4, y + 8, w - 8, h - 16);

    // Tête
    ctx.fillStyle = character.color;
    ctx.fillRect(x + 2, y, w - 4, 14);

    // Oreilles
    ctx.fillStyle = character.colorDark;
    ctx.fillRect(x, y - 6, 8, 10);
    ctx.fillRect(x + w - 8, y - 6, 8, 10);

    // Pattes (animation de course)
    const legOffset = Math.sin(Date.now() / 80) * 3;
    ctx.fillStyle = character.colorDark;
    ctx.fillRect(x + 6, y + h - 10 + legOffset, 6, 10);
    ctx.fillRect(x + w - 12, y + h - 10 - legOffset, 6, 10);

    // Yeux
    ctx.fillStyle = '#000';
    ctx.fillRect(x + 8, y + 4, 4, 4);
    ctx.fillRect(x + w - 12, y + 4, 4, 4);

    // Truffe
    ctx.fillStyle = '#000';
    ctx.fillRect(x + w / 2 - 3, y + 10, 6, 4);

    // Queue qui remue
    const tailWag = Math.sin(Date.now() / 100) * 5;
    ctx.fillStyle = character.color;
    ctx.save();
    ctx.translate(x + w / 2, y + 12);
    ctx.rotate((tailWag * Math.PI) / 180);
    ctx.fillRect(-3, -20, 6, 16);
    ctx.restore();
  }

  /**
   * Dessine un obstacle
   * @param {Object} obstacle
   */
  drawObstacle(obstacle) {
    const ctx = this.ctx;
    const s = this.scale;
    const x = LANES.POSITIONS[obstacle.lane] * s - (obstacle.width * s) / 2;
    const y = obstacle.y * s;

    // Ombre
    ctx.fillStyle = 'rgba(0, 0, 0, 0.4)';
    ctx.fillRect(x + 4, y + obstacle.height * s - 4, obstacle.width * s - 8, 8);

    // Corps de l'obstacle
    ctx.fillStyle = obstacle.color;
    ctx.fillRect(x, y, obstacle.width * s, obstacle.height * s);

    // Contour néon
    ctx.strokeStyle = COLORS.ACCENT;
    ctx.lineWidth = 1;
    ctx.strokeRect(x, y, obstacle.width * s, obstacle.height * s);

    // Effet de glow pour les grands obstacles
    if (obstacle.large) {
      ctx.shadowColor = COLORS.ACCENT;
      ctx.shadowBlur = 10;
      ctx.strokeRect(x, y, obstacle.width * s, obstacle.height * s);
      ctx.shadowBlur = 0;
    }
  }

  /**
   * Dessine une pièce
   * @param {Object} coin
   */
  drawCoin(coin) {
    const ctx = this.ctx;
    const s = this.scale;
    const x = LANES.POSITIONS[coin.lane] * s;
    const y = coin.y * s;
    const size = coin.size * s;

    // Animation de rotation
    const pulse = Math.sin(Date.now() / 200) * 0.2 + 1;

    ctx.save();
    ctx.translate(x, y);
    ctx.scale(pulse, 1);

    // Glow
    ctx.shadowColor = COLORS.COIN;
    ctx.shadowBlur = 15;

    // Pièce
    ctx.fillStyle = COLORS.COIN;
    ctx.beginPath();
    ctx.arc(0, 0, size / 2, 0, Math.PI * 2);
    ctx.fill();

    // Symbole $
    ctx.fillStyle = COLORS.PRIMARY_DARK;
    ctx.font = `${8 * s}px 'Press Start 2P', monospace`;
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText('$', 0, 0);

    ctx.shadowBlur = 0;
    ctx.restore();
  }

  /**
   * Dessine un bonus
   * @param {Object} bonus
   */
  drawBonus(bonus) {
    const ctx = this.ctx;
    const s = this.scale;
    const x = LANES.POSITIONS[bonus.lane] * s;
    const y = bonus.y * s;
    const size = bonus.size * s;

    // Animation
    const pulse = Math.sin(Date.now() / 150) * 0.3 + 1;
    const rotate = Date.now() / 500;

    ctx.save();
    ctx.translate(x, y);
    ctx.rotate(rotate);
    ctx.scale(pulse, pulse);

    // Glow
    ctx.shadowColor = COLORS.SECONDARY;
    ctx.shadowBlur = 20;

    // Étoile
    ctx.fillStyle = COLORS.SECONDARY;
    ctx.beginPath();
    for (let i = 0; i < 5; i++) {
      const angle = (i * 4 * Math.PI) / 5 - Math.PI / 2;
      const r = i === 0 ? size / 2 : size / 4;
      if (i === 0) {
        ctx.moveTo(Math.cos(angle) * size / 2, Math.sin(angle) * size / 2);
      } else {
        ctx.lineTo(Math.cos(angle) * size / 2, Math.sin(angle) * size / 2);
      }
      const innerAngle = angle + (2 * Math.PI) / 10;
      ctx.lineTo(Math.cos(innerAngle) * size / 4, Math.sin(innerAngle) * size / 4);
    }
    ctx.closePath();
    ctx.fill();

    ctx.shadowBlur = 0;
    ctx.restore();
  }

  /**
   * Dessine le texte avec effet néon
   * @param {string} text
   * @param {number} x
   * @param {number} y
   * @param {string} color
   * @param {number} size
   */
  drawNeonText(text, x, y, color = COLORS.PRIMARY, size = 16) {
    const ctx = this.ctx;

    ctx.font = `${size}px 'Press Start 2P', monospace`;
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';

    // Glow
    ctx.shadowColor = color;
    ctx.shadowBlur = 10;
    ctx.fillStyle = color;
    ctx.fillText(text, x, y);

    // Texte principal
    ctx.shadowBlur = 0;
    ctx.fillStyle = COLORS.WHITE;
    ctx.fillText(text, x, y);
  }
}
