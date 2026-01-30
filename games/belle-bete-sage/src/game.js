import { CHARACTERS, LEVELS, LEVEL_UP_SCORE, LANES, PLAYER } from './config.js';
import { Renderer } from './systems/Renderer.js';
import { Input } from './systems/Input.js';
import { Audio } from './systems/Audio.js';
import { Obstacle, Coin, Bonus } from './entities/Obstacle.js';

/**
 * Classe principale du jeu
 */
export class Game {
  constructor(canvas) {
    this.renderer = new Renderer(canvas);
    this.input = new Input();
    this.audio = new Audio();

    // État du jeu
    this.state = 'menu'; // menu, playing, paused, gameover
    this.character = null;
    this.characterConfig = null;

    // Joueur
    this.player = {
      lane: 1, // Voie centrale (0, 1, 2)
      jumping: false,
      jumpProgress: 0,
      jumpStartTime: 0
    };

    // Stats de jeu
    this.score = 0;
    this.highScore = parseInt(localStorage.getItem('belleBeteSage_highScore') || '0');
    this.lives = 0;
    this.level = 0;
    this.lastLevelScore = 0;

    // Entités
    this.obstacles = [];
    this.coins = [];
    this.bonuses = [];

    // Timing
    this.lastTime = 0;
    this.lastSpawn = 0;
    this.levelUpTimer = 0;

    // UI
    this.ui = {
      characterSelect: document.getElementById('character-select'),
      gameUI: document.getElementById('game-ui'),
      gameOver: document.getElementById('game-over'),
      levelUp: document.getElementById('level-up'),
      scoreDisplay: document.getElementById('score'),
      levelDisplay: document.getElementById('level'),
      livesDisplay: document.getElementById('lives-display'),
      finalScore: document.getElementById('final-score'),
      highScoreDisplay: document.getElementById('high-score')
    };

    this.init();
  }

  /**
   * Initialise le jeu
   */
  init() {
    this.input.init();
    this.setupCharacterSelect();
    this.setupGameControls();
    this.setupUI();
  }

  /**
   * Configure la sélection de personnage
   */
  setupCharacterSelect() {
    const cards = document.querySelectorAll('.character-card');
    cards.forEach(card => {
      card.addEventListener('click', () => {
        this.audio.init();
        this.selectCharacter(card.dataset.character);
      });
    });
  }

  /**
   * Sélectionne un personnage et démarre le jeu
   * @param {string} characterId
   */
  selectCharacter(characterId) {
    this.character = characterId;
    this.characterConfig = CHARACTERS[characterId];

    // Initialiser les stats basées sur le personnage
    this.lives = this.characterConfig.force;

    // Cacher l'écran de sélection
    this.ui.characterSelect.classList.add('hidden');
    this.ui.gameUI.classList.remove('hidden');

    // Démarrer le jeu
    this.startGame();
  }

  /**
   * Configure les contrôles du jeu
   */
  setupGameControls() {
    this.input.setCallbacks({
      left: () => this.moveLeft(),
      right: () => this.moveRight(),
      jump: () => this.jump(),
      pause: () => this.togglePause()
    });
  }

  /**
   * Configure les éléments UI
   */
  setupUI() {
    document.getElementById('restart-btn').addEventListener('click', () => {
      this.audio.init();
      this.restart();
    });

    document.getElementById('menu-btn').addEventListener('click', () => {
      this.returnToMenu();
    });
  }

  /**
   * Démarre une nouvelle partie
   */
  startGame() {
    this.state = 'playing';
    this.score = 0;
    this.level = 0;
    this.lastLevelScore = 0;
    this.lives = this.characterConfig.force;
    this.player.lane = 1;
    this.player.jumping = false;

    this.obstacles = [];
    this.coins = [];
    this.bonuses = [];

    this.updateUI();
    this.lastTime = performance.now();
    this.lastSpawn = 0;

    requestAnimationFrame((t) => this.gameLoop(t));
  }

  /**
   * Boucle principale du jeu
   * @param {number} currentTime
   */
  gameLoop(currentTime) {
    if (this.state !== 'playing' && this.state !== 'paused') {
      return;
    }

    const deltaTime = currentTime - this.lastTime;
    this.lastTime = currentTime;

    if (this.state === 'playing') {
      this.update(deltaTime, currentTime);
    }

    this.render();
    requestAnimationFrame((t) => this.gameLoop(t));
  }

  /**
   * Met à jour l'état du jeu
   * @param {number} deltaTime
   * @param {number} currentTime
   */
  update(deltaTime, currentTime) {
    const levelConfig = LEVELS[this.level];
    const speed = levelConfig.speed * (1 + this.characterConfig.vitesse * 0.1);

    // Mise à jour du score (basé sur la vitesse)
    this.score += Math.floor(speed * this.characterConfig.vitesse * deltaTime / 100);

    // Vérification level up
    if (this.score - this.lastLevelScore >= LEVEL_UP_SCORE && this.level < LEVELS.length - 1) {
      this.levelUp();
    }

    // Mise à jour du saut
    if (this.player.jumping) {
      this.player.jumpProgress = (currentTime - this.player.jumpStartTime) / PLAYER.JUMP_DURATION;
      if (this.player.jumpProgress >= 1) {
        this.player.jumping = false;
        this.player.jumpProgress = 0;
      }
    }

    // Spawn d'entités
    if (currentTime - this.lastSpawn > levelConfig.spawnInterval) {
      this.spawnEntities();
      this.lastSpawn = currentTime;
    }

    // Mise à jour des obstacles
    this.obstacles.forEach(obs => {
      obs.update(speed, deltaTime);
      if (obs.active && obs.checkCollision(this.player)) {
        this.hitObstacle();
        obs.active = false;
      }
    });

    // Mise à jour des pièces
    this.coins.forEach(coin => {
      coin.update(speed, deltaTime);
      if (coin.active && coin.checkCollision(this.player)) {
        this.collectCoin(coin);
      }
    });

    // Mise à jour des bonus
    this.bonuses.forEach(bonus => {
      bonus.update(speed, deltaTime);
      if (bonus.active && bonus.checkCollision(this.player)) {
        this.collectBonus(bonus);
      }
    });

    // Nettoyage des entités inactives
    this.obstacles = this.obstacles.filter(o => o.active);
    this.coins = this.coins.filter(c => c.active);
    this.bonuses = this.bonuses.filter(b => b.active);

    // Mise à jour de l'affichage du score
    this.ui.scoreDisplay.textContent = this.score;
  }

  /**
   * Spawn des obstacles, pièces et bonus
   */
  spawnEntities() {
    const lane = Math.floor(Math.random() * LANES.COUNT);
    const rand = Math.random();

    if (rand < 0.6) {
      // 60% chance obstacle
      const isLarge = Math.random() < 0.3; // 30% grands obstacles
      this.obstacles.push(new Obstacle(lane, null, isLarge));
    } else if (rand < 0.9) {
      // 30% chance pièce
      this.coins.push(new Coin(lane));
    } else {
      // 10% chance bonus
      this.bonuses.push(new Bonus(lane));
    }
  }

  /**
   * Collision avec un obstacle
   */
  hitObstacle() {
    this.lives--;
    this.audio.playHit();
    this.updateLivesDisplay();

    if (this.lives <= 0) {
      this.gameOver();
    }
  }

  /**
   * Collecte une pièce
   * @param {Coin} coin
   */
  collectCoin(coin) {
    this.score += coin.value;
    coin.active = false;
    this.audio.playCoin();
  }

  /**
   * Collecte un bonus
   * @param {Bonus} bonus
   */
  collectBonus(bonus) {
    this.score += bonus.getValue(this.characterConfig.beaute);
    bonus.active = false;
    this.audio.playBonus();
  }

  /**
   * Passage au niveau suivant
   */
  levelUp() {
    this.level++;
    this.lastLevelScore = this.score;
    this.audio.playLevelUp();

    // Afficher message
    this.ui.levelUp.classList.remove('hidden');
    this.ui.levelDisplay.textContent = LEVELS[this.level].name;

    setTimeout(() => {
      this.ui.levelUp.classList.add('hidden');
    }, 1000);
  }

  /**
   * Game over
   */
  gameOver() {
    this.state = 'gameover';
    this.audio.playGameOver();

    // Sauvegarder le high score
    if (this.score > this.highScore) {
      this.highScore = this.score;
      localStorage.setItem('belleBeteSage_highScore', this.highScore.toString());
    }

    // Afficher l'écran game over
    this.ui.gameUI.classList.add('hidden');
    this.ui.gameOver.classList.remove('hidden');
    this.ui.finalScore.textContent = this.score;
    this.ui.highScoreDisplay.textContent = this.highScore;
  }

  /**
   * Rendu du jeu
   */
  render() {
    const levelConfig = LEVELS[this.level];
    const speed = levelConfig.speed * (1 + this.characterConfig.vitesse * 0.1);

    this.renderer.clear();
    this.renderer.drawBackground(speed);

    // Dessiner les obstacles
    this.obstacles.forEach(obs => this.renderer.drawObstacle(obs));

    // Dessiner les pièces
    this.coins.forEach(coin => this.renderer.drawCoin(coin));

    // Dessiner les bonus
    this.bonuses.forEach(bonus => this.renderer.drawBonus(bonus));

    // Dessiner le joueur
    this.renderer.drawPlayer(this.player, this.characterConfig);

    // Pause overlay
    if (this.state === 'paused') {
      this.renderer.ctx.fillStyle = 'rgba(0, 0, 0, 0.7)';
      this.renderer.ctx.fillRect(0, 0, 640, 480);
      this.renderer.drawNeonText('PAUSE', 320, 240, '#ff6b35', 32);
    }
  }

  /**
   * Déplace le joueur à gauche
   */
  moveLeft() {
    if (this.state !== 'playing') return;
    if (this.player.lane > 0) {
      this.player.lane--;
      this.audio.playLaneChange();
    }
  }

  /**
   * Déplace le joueur à droite
   */
  moveRight() {
    if (this.state !== 'playing') return;
    if (this.player.lane < LANES.COUNT - 1) {
      this.player.lane++;
      this.audio.playLaneChange();
    }
  }

  /**
   * Fait sauter le joueur
   */
  jump() {
    if (this.state !== 'playing') return;
    if (!this.player.jumping) {
      this.player.jumping = true;
      this.player.jumpStartTime = performance.now();
      this.audio.playJump();
    }
  }

  /**
   * Bascule la pause
   */
  togglePause() {
    if (this.state === 'playing') {
      this.state = 'paused';
    } else if (this.state === 'paused') {
      this.state = 'playing';
      this.lastTime = performance.now();
    }
  }

  /**
   * Met à jour l'UI
   */
  updateUI() {
    this.ui.scoreDisplay.textContent = this.score;
    this.ui.levelDisplay.textContent = LEVELS[this.level].name;
    this.updateLivesDisplay();
  }

  /**
   * Met à jour l'affichage des vies
   */
  updateLivesDisplay() {
    let hearts = '';
    for (let i = 0; i < this.characterConfig.force; i++) {
      hearts += i < this.lives ? '♥' : '♡';
    }
    this.ui.livesDisplay.textContent = hearts;
  }

  /**
   * Redémarre le jeu
   */
  restart() {
    this.ui.gameOver.classList.add('hidden');
    this.ui.gameUI.classList.remove('hidden');
    this.startGame();
  }

  /**
   * Retourne au menu principal
   */
  returnToMenu() {
    this.state = 'menu';
    this.ui.gameOver.classList.add('hidden');
    this.ui.gameUI.classList.add('hidden');
    this.ui.characterSelect.classList.remove('hidden');
  }
}
