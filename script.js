/* =========================================================================
   [전역 변수 및 캔버스 초기화]
========================================================================= */

// 게임 상태
const GAME_STATE = {
  START: 'START',
  PLAYING: 'PLAYING',
  GAMEOVER: 'GAMEOVER'
};
let currentState = GAME_STATE.START;
let winner = null;

const canvas = document.getElementById('gameCanvas');
const ctx = canvas.getContext('2d');

// 플레이어 속도 등 기본값
const SETTINGS = {
  PLAYER_SPEED: 5,        // 최대 속도
  PLAYER_ACCEL: 0.5,      // 가속도
  PLAYER_FRICTION: 0.92,   // 마찰력 (낮을수록 빨리 멈춤)
  BULLET_SPEED: 24,       // 총알 속도
  SHOOT_COOLDOWN: 15,     // 연사 속도 (SHOOT_COOLDOWN 프레임에 1발)
  MAX_HP: 5,              // 최대 체력
  MAX_AMMO: 10,           // 탄창 최대 용량
  RELOAD_TIME: 150,        // 재장전 시간 (60프레임 = 1초, 120 = 2초)
  NORMAL_FONT_COLOR: 'rgba(0, 0, 0, 0.6)' // UI에 사용하는 기본 폰트 컬러
};

canvas.width = 1500;
canvas.height = 900;

/* =========================================================================
   [화면 렌더링 함수 모음]
========================================================================= */
function drawStartScreen() {
  const blink = Math.floor(Date.now() / 500) % 2;
  ctx.fillStyle = "black";
  ctx.fillRect(0, 0, canvas.width, canvas.height);

  ctx.fillStyle = "white";
  ctx.textAlign = "center";
  
  if (blink) {
    ctx.font = "60px Arial";
    ctx.fillText("Press Any Key", canvas.width / 2, canvas.height / 2);
  }
  ctx.font = "20px Arial";
  ctx.fillText("2 Player Shooting Game", canvas.width / 2, canvas.height / 2 + 50);
}

function drawGameOver() {
  ctx.fillStyle = SETTINGS.NORMAL_FONT_COLOR;
  ctx.fillRect(0, 0, canvas.width, canvas.height);
  
  ctx.fillStyle = "white";
  ctx.font = "60px Arial";
  ctx.textAlign = "center";
  ctx.fillText(`${winner} WIN!`, canvas.width / 2, canvas.height / 2);

  ctx.font = "25px Arial";
  ctx.fillText("Press R to Restart", canvas.width / 2, canvas.height / 2 + 50);
}

function drawUI() {

  ctx.fillStyle = SETTINGS.NORMAL_FONT_COLOR;
  
  // P1 조작법 및 탄약 (좌측 상단)
  ctx.textAlign = "left";
  ctx.font = "bold 18px Arial";
  ctx.fillText("P1 (Blue)", 20, 30);
  ctx.font = "14px Arial";
  ctx.fillText("Move: W, A, S, D | Shoot: F | Reload: V", 20, 55);
  
  ctx.font = "bold 16px Arial";
  ctx.fillStyle = p1.isReloading ? "orange" : SETTINGS.NORMAL_FONT_COLOR;
  ctx.fillText(`Ammo: ${p1.isReloading ? "RELOADING..." : p1.ammo + " / " + SETTINGS.MAX_AMMO}`, 20, 80);

  // P2 조작법 및 탄약 (우측 상단)
  ctx.textAlign = "right";
  ctx.fillStyle = SETTINGS.NORMAL_FONT_COLOR;
  ctx.font = "bold 18px Arial";
  ctx.fillText("P2 (Red)", canvas.width - 20, 30);
  ctx.font = "14px Arial";
  ctx.fillText("Move: Arrows | Shoot: Num 9 | Reload: Num 0", canvas.width - 20, 55);
  
  ctx.font = "bold 16px Arial";
  ctx.fillStyle = p2.isReloading ? "orange" : SETTINGS.NORMAL_FONT_COLOR;
  ctx.fillText(`Ammo: ${p2.isReloading ? "RELOADING..." : p2.ammo + " / " + SETTINGS.MAX_AMMO}`, canvas.width - 20, 80);
}

function resetGame() {
  p1.x = 100; p1.y = 300; p1.vx = 0; p1.vy = 0;
  p1.hp = SETTINGS.MAX_HP; p1.ammo = SETTINGS.MAX_AMMO; p1.isReloading = false;
  
  p2.x = 1400; p2.y = 600; p2.vx = 0; p2.vy = 0;
  p2.hp = SETTINGS.MAX_HP; p2.ammo = SETTINGS.MAX_AMMO; p2.isReloading = false;

  bullets.length = 0;
  currentState = GAME_STATE.START;
  winner = null;
}

/* =========================================================================
   [유틸리티 함수 모음]
========================================================================= */
function isColliding(a, b) {
  const dx = a.x - b.x;
  const dy = a.y - b.y;
  return Math.hypot(dx, dy) < (a.radius + b.radius);
}

function invertColor(c) {
  return { r: 255 - c.r, g: 255 - c.g, b: 255 - c.b };
}

/* =========================================================================
   [클래스 모음]
========================================================================= */
class GameObject {
  constructor(x, y, color) {
    this.x = x; this.y = y;
    this.vx = 0; this.vy = 0;
    this.accel = SETTINGS.PLAYER_ACCEL;
    this.friction = SETTINGS.PLAYER_FRICTION;
    this.maxSpeed = SETTINGS.PLAYER_SPEED;
    this.color = color;
    this.radius = 15;
    this.dir = { x: 0, y: -1 };
  }

  update(canvasWidth, canvasHeight) {
    this.vx *= this.friction;
    this.vy *= this.friction;

    if (Math.abs(this.vx) < 0.01) this.vx = 0;
    if (Math.abs(this.vy) < 0.01) this.vy = 0;

    this.x += this.vx;
    this.y += this.vy;

    this.checkBoundary(canvasWidth, canvasHeight);
  }

  checkBoundary(width, height) {
    if (this.x < this.radius) { this.x = this.radius; this.vx *= -1; }
    else if (this.x > width - this.radius) { this.x = width - this.radius; this.vx *= -1; }

    if (this.y < this.radius) { this.y = this.radius; this.vy *= -1; }
    else if (this.y > height - this.radius) { this.y = height - this.radius; this.vy *= -1; }
  }

  draw(ctx) {
    let c = this.hitTimer > 0 ? invertColor(this.color) : this.color;
    ctx.fillStyle = `rgb(${c.r}, ${c.g}, ${c.b})`;
    ctx.beginPath();
    ctx.arc(this.x, this.y, this.radius, 0, Math.PI * 2);
    ctx.fill();
    ctx.closePath();
  }
}

class Player extends GameObject {
  constructor(x, y, color, controls) {
    super(x, y, color);
    this.controls = controls;
    this.hp = SETTINGS.MAX_HP;
    this.cooldown = 0;
    this.hitTimer = 0;
    
    // 탄창 시스템
    this.ammo = SETTINGS.MAX_AMMO;
    this.reloadTimer = 0;
    this.isReloading = false;
  }

  handleInput(keys) {
    let dx = 0; let dy = 0;

    if (keys[this.controls.up]) { this.vy -= this.accel; dy -= 1; }
    if (keys[this.controls.down]) { this.vy += this.accel; dy += 1; }
    if (keys[this.controls.left]) { this.vx -= this.accel; dx -= 1; }
    if (keys[this.controls.right]) { this.vx += this.accel; dx += 1; }

    if (dx !== 0 || dy !== 0) {
      const len = Math.hypot(dx, dy);
      this.dir = { x: dx / len, y: dy / len };
    }

    this.vx = Math.max(-this.maxSpeed, Math.min(this.maxSpeed, this.vx));
    this.vy = Math.max(-this.maxSpeed, Math.min(this.maxSpeed, this.vy));
  }

  shoot(bullets) {
    if (this.cooldown > 0 || this.isReloading) return;

    if (this.ammo > 0) {
      this.ammo--;
      this.cooldown = SETTINGS.SHOOT_COOLDOWN;
      
      bullets.push(new Bullet(
        this.x, this.y, 
        this.dir.x * SETTINGS.BULLET_SPEED, 
        this.dir.y * SETTINGS.BULLET_SPEED, 
        this.color, this
      ));

      if (this.ammo === 0) {
        this.startReload();
      }
    }
  }

  startReload() {
    if (!this.isReloading && this.ammo < SETTINGS.MAX_AMMO) {
      this.isReloading = true;
      this.reloadTimer = SETTINGS.RELOAD_TIME;
    }
  }

  update(canvasWidth, canvasHeight) {
    super.update(canvasWidth, canvasHeight);
    
    if (this.cooldown > 0) this.cooldown--;
    if (this.hitTimer > 0) this.hitTimer--;

    if (this.isReloading) {
      this.reloadTimer--;
      if (this.reloadTimer <= 0) {
        this.ammo = SETTINGS.MAX_AMMO;
        this.isReloading = false;
      }
    }
  }

  draw(ctx) {
    super.draw(ctx);

    const barWidth = 10;
    const barHeight = 6;
    const spacing = 3;
    const totalBarWidth = (barWidth * SETTINGS.MAX_HP) + (spacing * (SETTINGS.MAX_HP - 1));
    
    let startX = this.x - (totalBarWidth / 2);
    let startY = this.y - this.radius - 20;

    for (let i = 0; i < SETTINGS.MAX_HP; i++) {
      if (i < this.hp) {
        ctx.fillStyle = `rgb(${this.color.r}, ${this.color.g}, ${this.color.b})`;
        ctx.fillRect(startX + i * (barWidth + spacing), startY, barWidth, barHeight);
      } else {
        ctx.strokeStyle = "rgba(100, 100, 100, 0.5)";
        ctx.strokeRect(startX + i * (barWidth + spacing), startY, barWidth, barHeight);
      }
    }
  }
}

class Bullet extends GameObject {
  constructor(x, y, vx, vy, color, owner) {
    super(x, y, color);
    this.vx = vx; this.vy = vy;
    this.radius = 5;
    this.life = 100;
    this.friction = 1;
    this.owner = owner;
  }

  update(canvasWidth, canvasHeight) {
    super.update(canvasWidth, canvasHeight);
    this.life--;
  }

  isAlive() {
    return this.life > 0;
  }
}

/* =========================================================================
   [인스턴스 생성 및 데이터 배열 초기화]
========================================================================= */
const keys = {};
const bullets = [];

// Player 1 (파란색, WASD & F, 수동재장전 V)
const p1 = new Player(100, 300, { r: 0, g: 0, b: 255 }, {
  up: 'w', down: 's', left: 'a', right: 'd', shoot: 'f', reload: 'v'
});

// Player 2 (빨간색, 방향키 & Num9, 수동재장전 Num0)
const p2 = new Player(1400, 600, { r: 255, g: 0, b: 0 }, {
  up: 'arrowup', down: 'arrowdown', left: 'arrowleft', right: 'arrowright', shoot: '9', reload: '0'
});

/* =========================================================================
   [메인 게임 루프]
========================================================================= */
function gameLoop() {
  if (currentState === GAME_STATE.START) {
    drawStartScreen();
    requestAnimationFrame(gameLoop);
    return;
  }

  ctx.clearRect(0, 0, canvas.width, canvas.height);

  if (currentState === GAME_STATE.PLAYING) {
    p1.handleInput(keys);
    p1.update(canvas.width, canvas.height);

    p2.handleInput(keys);
    p2.update(canvas.width, canvas.height);

    // 공격 처리 (꾹 누르기 지원)
    if (keys[p1.controls.shoot]) p1.shoot(bullets);
    if (keys[p2.controls.shoot]) p2.shoot(bullets);

    // 수동 재장전 처리
    if (keys[p1.controls.reload]) p1.startReload();
    if (keys[p2.controls.reload]) p2.startReload();

    // 총알 업데이트 및 충돌 판정
    for (let i = bullets.length - 1; i >= 0; i--) {
      const b = bullets[i];
      b.update(canvas.width, canvas.height);

      if (!b.isAlive()) {
        bullets.splice(i, 1);
        continue;
      }

      for (const player of [p1, p2]) {
        if (b.owner === player) continue;

        if (isColliding(b, player)) {
          player.hp--;
          player.vx += b.vx * 0.4;
          player.vy += b.vy * 0.4;
          player.hitTimer = 10;
          
          bullets.splice(i, 1);
          break;
        }
      }
    }

    // 승패 체크
    if (p1.hp <= 0 || p2.hp <= 0) {
      winner = p1.hp <= 0 ? "P2" : "P1";
      currentState = GAME_STATE.GAMEOVER;
    }
  }

  p1.draw(ctx);
  p2.draw(ctx);
  bullets.forEach(b => b.draw(ctx));
  drawUI();

  if (currentState === GAME_STATE.GAMEOVER) {
    drawGameOver();
  }

  requestAnimationFrame(gameLoop);
}

/* =========================================================================
   [이벤트 리스너 등록]
========================================================================= */
window.addEventListener('keydown', e => {
  const key = e.key.toLowerCase();
  keys[key] = true;

  if (currentState === GAME_STATE.START) {
    currentState = GAME_STATE.PLAYING;
  }

  if (currentState === GAME_STATE.GAMEOVER && key === 'r') {
    resetGame();
    currentState = GAME_STATE.PLAYING;
  }
});

window.addEventListener('keyup', e => {
  const key = e.key.toLowerCase();
  keys[key] = false; 
});

// 엔진 시동
gameLoop();