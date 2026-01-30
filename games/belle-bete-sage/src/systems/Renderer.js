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
    const w = obstacle.width * s;
    const h = obstacle.height * s;

    // Ombre
    ctx.fillStyle = 'rgba(0, 0, 0, 0.4)';
    ctx.fillRect(x + 4, y + h - 4, w - 8, 8);

    // Dessiner selon le type d'obstacle
    switch (obstacle.name) {
      case 'poubelle':
        this.drawPoubelle(ctx, x, y, w, h);
        break;
      case 'cone':
        this.drawCone(ctx, x, y, w, h);
        break;
      case 'chat':
        this.drawChat(ctx, x, y, w, h);
        break;
      case 'rat':
        this.drawRat(ctx, x, y, w, h);
        break;
      case 'voiture':
        this.drawVoiture(ctx, x, y, w, h);
        break;
      case 'moto':
        this.drawMoto(ctx, x, y, w, h);
        break;
      case 'vache':
        this.drawVache(ctx, x, y, w, h);
        break;
      default:
        ctx.fillStyle = obstacle.color;
        ctx.fillRect(x, y, w, h);
    }

    // Effet de glow pour les grands obstacles
    if (obstacle.large) {
      ctx.strokeStyle = COLORS.ACCENT;
      ctx.shadowColor = COLORS.ACCENT;
      ctx.shadowBlur = 10;
      ctx.lineWidth = 2;
      ctx.strokeRect(x, y, w, h);
      ctx.shadowBlur = 0;
    }
  }

  /** Poubelle (trash can) */
  drawPoubelle(ctx, x, y, w, h) {
    // Corps de la poubelle
    ctx.fillStyle = '#555555';
    ctx.fillRect(x + w * 0.1, y + h * 0.2, w * 0.8, h * 0.8);
    // Couvercle
    ctx.fillStyle = '#666666';
    ctx.fillRect(x, y, w, h * 0.25);
    // Poignée du couvercle
    ctx.fillStyle = '#444444';
    ctx.fillRect(x + w * 0.35, y - h * 0.1, w * 0.3, h * 0.15);
    // Rayures horizontales
    ctx.fillStyle = '#444444';
    ctx.fillRect(x + w * 0.15, y + h * 0.4, w * 0.7, h * 0.06);
    ctx.fillRect(x + w * 0.15, y + h * 0.6, w * 0.7, h * 0.06);
  }

  /** Cone (traffic cone) */
  drawCone(ctx, x, y, w, h) {
    // Base
    ctx.fillStyle = '#222222';
    ctx.fillRect(x, y + h * 0.85, w, h * 0.15);
    // Corps du cône (trapèze)
    ctx.fillStyle = '#ff6b00';
    ctx.beginPath();
    ctx.moveTo(x + w * 0.1, y + h * 0.85);
    ctx.lineTo(x + w * 0.35, y);
    ctx.lineTo(x + w * 0.65, y);
    ctx.lineTo(x + w * 0.9, y + h * 0.85);
    ctx.closePath();
    ctx.fill();
    // Bandes blanches réfléchissantes
    ctx.fillStyle = '#ffffff';
    ctx.beginPath();
    ctx.moveTo(x + w * 0.18, y + h * 0.55);
    ctx.lineTo(x + w * 0.4, y + h * 0.15);
    ctx.lineTo(x + w * 0.6, y + h * 0.15);
    ctx.lineTo(x + w * 0.82, y + h * 0.55);
    ctx.lineTo(x + w * 0.78, y + h * 0.65);
    ctx.lineTo(x + w * 0.55, y + h * 0.25);
    ctx.lineTo(x + w * 0.45, y + h * 0.25);
    ctx.lineTo(x + w * 0.22, y + h * 0.65);
    ctx.closePath();
    ctx.fill();
  }

  /** Chat (cat) */
  drawChat(ctx, x, y, w, h) {
    // Corps
    ctx.fillStyle = '#333333';
    ctx.fillRect(x + w * 0.15, y + h * 0.35, w * 0.7, h * 0.55);
    // Tête
    ctx.fillRect(x + w * 0.25, y + h * 0.1, w * 0.5, h * 0.4);
    // Oreilles triangulaires
    ctx.beginPath();
    ctx.moveTo(x + w * 0.25, y + h * 0.25);
    ctx.lineTo(x + w * 0.15, y);
    ctx.lineTo(x + w * 0.4, y + h * 0.1);
    ctx.closePath();
    ctx.fill();
    ctx.beginPath();
    ctx.moveTo(x + w * 0.75, y + h * 0.25);
    ctx.lineTo(x + w * 0.85, y);
    ctx.lineTo(x + w * 0.6, y + h * 0.1);
    ctx.closePath();
    ctx.fill();
    // Yeux (brillants)
    ctx.fillStyle = '#44ff44';
    ctx.fillRect(x + w * 0.32, y + h * 0.22, w * 0.12, h * 0.1);
    ctx.fillRect(x + w * 0.56, y + h * 0.22, w * 0.12, h * 0.1);
    // Pupilles
    ctx.fillStyle = '#000000';
    ctx.fillRect(x + w * 0.36, y + h * 0.24, w * 0.04, h * 0.06);
    ctx.fillRect(x + w * 0.6, y + h * 0.24, w * 0.04, h * 0.06);
    // Queue
    ctx.fillStyle = '#333333';
    ctx.fillRect(x + w * 0.8, y + h * 0.4, w * 0.25, h * 0.12);
    ctx.fillRect(x + w * 0.95, y + h * 0.2, w * 0.1, h * 0.25);
  }

  /** Rat */
  drawRat(ctx, x, y, w, h) {
    // Corps ovale
    ctx.fillStyle = '#8b7355';
    ctx.beginPath();
    ctx.ellipse(x + w * 0.45, y + h * 0.6, w * 0.4, h * 0.35, 0, 0, Math.PI * 2);
    ctx.fill();
    // Tête
    ctx.beginPath();
    ctx.ellipse(x + w * 0.15, y + h * 0.5, w * 0.2, h * 0.25, -0.3, 0, Math.PI * 2);
    ctx.fill();
    // Oreilles rondes
    ctx.fillStyle = '#a08060';
    ctx.beginPath();
    ctx.arc(x + w * 0.1, y + h * 0.25, w * 0.12, 0, Math.PI * 2);
    ctx.fill();
    ctx.beginPath();
    ctx.arc(x + w * 0.25, y + h * 0.2, w * 0.1, 0, Math.PI * 2);
    ctx.fill();
    // Oeil
    ctx.fillStyle = '#000000';
    ctx.beginPath();
    ctx.arc(x + w * 0.1, y + h * 0.45, w * 0.06, 0, Math.PI * 2);
    ctx.fill();
    // Nez rose
    ctx.fillStyle = '#ffaaaa';
    ctx.beginPath();
    ctx.arc(x + w * 0.02, y + h * 0.55, w * 0.05, 0, Math.PI * 2);
    ctx.fill();
    // Queue
    ctx.strokeStyle = '#8b7355';
    ctx.lineWidth = 3;
    ctx.beginPath();
    ctx.moveTo(x + w * 0.85, y + h * 0.6);
    ctx.quadraticCurveTo(x + w * 1.1, y + h * 0.3, x + w * 1.15, y + h * 0.7);
    ctx.stroke();
  }

  /** Voiture (car) */
  drawVoiture(ctx, x, y, w, h) {
    // Carrosserie bas
    ctx.fillStyle = '#cc3333';
    ctx.fillRect(x, y + h * 0.4, w, h * 0.45);
    // Carrosserie haut (cabine)
    ctx.fillRect(x + w * 0.2, y + h * 0.1, w * 0.55, h * 0.35);
    // Pare-brise
    ctx.fillStyle = '#88ccff';
    ctx.beginPath();
    ctx.moveTo(x + w * 0.22, y + h * 0.4);
    ctx.lineTo(x + w * 0.3, y + h * 0.15);
    ctx.lineTo(x + w * 0.5, y + h * 0.15);
    ctx.lineTo(x + w * 0.5, y + h * 0.4);
    ctx.closePath();
    ctx.fill();
    // Vitre arrière
    ctx.beginPath();
    ctx.moveTo(x + w * 0.55, y + h * 0.15);
    ctx.lineTo(x + w * 0.72, y + h * 0.15);
    ctx.lineTo(x + w * 0.75, y + h * 0.4);
    ctx.lineTo(x + w * 0.55, y + h * 0.4);
    ctx.closePath();
    ctx.fill();
    // Roues
    ctx.fillStyle = '#222222';
    ctx.beginPath();
    ctx.arc(x + w * 0.2, y + h * 0.85, w * 0.12, 0, Math.PI * 2);
    ctx.fill();
    ctx.beginPath();
    ctx.arc(x + w * 0.8, y + h * 0.85, w * 0.12, 0, Math.PI * 2);
    ctx.fill();
    // Jantes
    ctx.fillStyle = '#888888';
    ctx.beginPath();
    ctx.arc(x + w * 0.2, y + h * 0.85, w * 0.06, 0, Math.PI * 2);
    ctx.fill();
    ctx.beginPath();
    ctx.arc(x + w * 0.8, y + h * 0.85, w * 0.06, 0, Math.PI * 2);
    ctx.fill();
    // Phares
    ctx.fillStyle = '#ffff88';
    ctx.fillRect(x, y + h * 0.45, w * 0.06, h * 0.12);
    ctx.fillRect(x + w * 0.94, y + h * 0.45, w * 0.06, h * 0.12);
  }

  /** Moto (motorcycle) */
  drawMoto(ctx, x, y, w, h) {
    // Roue arrière
    ctx.fillStyle = '#222222';
    ctx.beginPath();
    ctx.arc(x + w * 0.75, y + h * 0.75, w * 0.2, 0, Math.PI * 2);
    ctx.fill();
    // Roue avant
    ctx.beginPath();
    ctx.arc(x + w * 0.2, y + h * 0.75, w * 0.18, 0, Math.PI * 2);
    ctx.fill();
    // Jantes
    ctx.fillStyle = '#888888';
    ctx.beginPath();
    ctx.arc(x + w * 0.75, y + h * 0.75, w * 0.08, 0, Math.PI * 2);
    ctx.fill();
    ctx.beginPath();
    ctx.arc(x + w * 0.2, y + h * 0.75, w * 0.07, 0, Math.PI * 2);
    ctx.fill();
    // Cadre
    ctx.fillStyle = '#4444aa';
    ctx.beginPath();
    ctx.moveTo(x + w * 0.2, y + h * 0.6);
    ctx.lineTo(x + w * 0.35, y + h * 0.2);
    ctx.lineTo(x + w * 0.7, y + h * 0.25);
    ctx.lineTo(x + w * 0.75, y + h * 0.55);
    ctx.lineTo(x + w * 0.5, y + h * 0.5);
    ctx.closePath();
    ctx.fill();
    // Réservoir
    ctx.fillStyle = '#5555cc';
    ctx.beginPath();
    ctx.ellipse(x + w * 0.5, y + h * 0.35, w * 0.18, h * 0.15, 0, 0, Math.PI * 2);
    ctx.fill();
    // Guidon
    ctx.strokeStyle = '#666666';
    ctx.lineWidth = 3;
    ctx.beginPath();
    ctx.moveTo(x + w * 0.25, y + h * 0.1);
    ctx.lineTo(x + w * 0.35, y + h * 0.25);
    ctx.lineTo(x + w * 0.45, y + h * 0.1);
    ctx.stroke();
    // Phare
    ctx.fillStyle = '#ffff88';
    ctx.beginPath();
    ctx.arc(x + w * 0.28, y + h * 0.35, w * 0.06, 0, Math.PI * 2);
    ctx.fill();
    // Échappement
    ctx.fillStyle = '#888888';
    ctx.fillRect(x + w * 0.6, y + h * 0.55, w * 0.3, h * 0.08);
  }

  /** Vache (cow) */
  drawVache(ctx, x, y, w, h) {
    // Corps
    ctx.fillStyle = '#f5f5dc';
    ctx.fillRect(x + w * 0.15, y + h * 0.3, w * 0.7, h * 0.45);
    // Taches noires
    ctx.fillStyle = '#222222';
    ctx.beginPath();
    ctx.ellipse(x + w * 0.3, y + h * 0.45, w * 0.12, h * 0.15, 0.3, 0, Math.PI * 2);
    ctx.fill();
    ctx.beginPath();
    ctx.ellipse(x + w * 0.6, y + h * 0.5, w * 0.1, h * 0.12, -0.2, 0, Math.PI * 2);
    ctx.fill();
    ctx.beginPath();
    ctx.ellipse(x + w * 0.75, y + h * 0.4, w * 0.08, h * 0.1, 0, 0, Math.PI * 2);
    ctx.fill();
    // Tête
    ctx.fillStyle = '#f5f5dc';
    ctx.fillRect(x, y + h * 0.2, w * 0.25, h * 0.35);
    // Museau rose
    ctx.fillStyle = '#ffcccc';
    ctx.fillRect(x - w * 0.05, y + h * 0.35, w * 0.15, h * 0.18);
    // Narines
    ctx.fillStyle = '#333333';
    ctx.beginPath();
    ctx.arc(x + w * 0.02, y + h * 0.42, w * 0.025, 0, Math.PI * 2);
    ctx.fill();
    ctx.beginPath();
    ctx.arc(x + w * 0.08, y + h * 0.42, w * 0.025, 0, Math.PI * 2);
    ctx.fill();
    // Yeux
    ctx.fillStyle = '#000000';
    ctx.beginPath();
    ctx.arc(x + w * 0.08, y + h * 0.28, w * 0.03, 0, Math.PI * 2);
    ctx.fill();
    ctx.beginPath();
    ctx.arc(x + w * 0.18, y + h * 0.28, w * 0.03, 0, Math.PI * 2);
    ctx.fill();
    // Oreilles
    ctx.fillStyle = '#f5f5dc';
    ctx.beginPath();
    ctx.ellipse(x + w * 0.02, y + h * 0.18, w * 0.08, h * 0.06, -0.5, 0, Math.PI * 2);
    ctx.fill();
    ctx.beginPath();
    ctx.ellipse(x + w * 0.23, y + h * 0.18, w * 0.08, h * 0.06, 0.5, 0, Math.PI * 2);
    ctx.fill();
    // Cornes
    ctx.fillStyle = '#ddccaa';
    ctx.beginPath();
    ctx.moveTo(x + w * 0.05, y + h * 0.2);
    ctx.lineTo(x - w * 0.02, y + h * 0.05);
    ctx.lineTo(x + w * 0.1, y + h * 0.15);
    ctx.closePath();
    ctx.fill();
    ctx.beginPath();
    ctx.moveTo(x + w * 0.2, y + h * 0.2);
    ctx.lineTo(x + w * 0.27, y + h * 0.05);
    ctx.lineTo(x + w * 0.15, y + h * 0.15);
    ctx.closePath();
    ctx.fill();
    // Pattes
    ctx.fillStyle = '#f5f5dc';
    ctx.fillRect(x + w * 0.2, y + h * 0.7, w * 0.1, h * 0.3);
    ctx.fillRect(x + w * 0.35, y + h * 0.7, w * 0.1, h * 0.3);
    ctx.fillRect(x + w * 0.55, y + h * 0.7, w * 0.1, h * 0.3);
    ctx.fillRect(x + w * 0.7, y + h * 0.7, w * 0.1, h * 0.3);
    // Sabots
    ctx.fillStyle = '#333333';
    ctx.fillRect(x + w * 0.2, y + h * 0.92, w * 0.1, h * 0.08);
    ctx.fillRect(x + w * 0.35, y + h * 0.92, w * 0.1, h * 0.08);
    ctx.fillRect(x + w * 0.55, y + h * 0.92, w * 0.1, h * 0.08);
    ctx.fillRect(x + w * 0.7, y + h * 0.92, w * 0.1, h * 0.08);
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
