/*
  환경 설정 및 캔버스 초기화
*/
let gameStarted = false;
let gameOver = false;
let winner = null;

const canvas = document.getElementById('gameCanvas');
const ctx = canvas.getContext('2d');

canvas.width = 1500;
canvas.height = 900;

/*
  시작 화면 함수
*/
function drawStartScreen() {
  const blink = Math.floor(Date.now() / 500) % 2;

  ctx.fillStyle = "black";
  ctx.fillRect(0, 0, canvas.width, canvas.height);

  ctx.fillStyle = "white";
  ctx.font = "60px Arial";
  ctx.textAlign = "center";

  if (blink) {
    ctx.fillText("Press Any Key", canvas.width / 2, canvas.height / 2);
  }

  ctx.font = "20px Arial";
  ctx.fillText("2 Player Shooting Game", canvas.width / 2, canvas.height / 2 + 50);
}

/*
  리셋 함수
*/
function resetGame() {
  p1.x = 100;
  p1.y = 300;
  p1.vx = 0;
  p1.vy = 0;
  p1.hp = 5;

  p2.x = 1400;
  p2.y = 600;
  p2.vx = 0;
  p2.vy = 0;
  p2.hp = 5;

  bullets.length = 0;
  gameOver = false;
  winner = null;
}

/*
  게임 객체 최상위 클래스
*/
class GameObject {
  constructor(x, y, color) {
    this.x = x;
    this.y = y;
    this.vx = 0; // x축 속도
    this.vy = 0; // y축 속도
    this.accel = 0.5; // 가속도 힘
    this.friction = 0.92; // 마찰력
    this.maxSpeed = 6; // 최대 이동 속도
    this.color = color;
    this.radius = 15; // 충돌 판정용 반지름
    this.dir = { x: 0, y: -1 }; // 방향
  }

  // 물리 시뮬레이션 업데이트
  update(canvasWidth, canvasHeight) {
    // 마찰력 적용
    this.vx *= this.friction;
    this.vy *= this.friction;

    // 미세 움직임 멈추기
    if (Math.abs(this.vx) < 0.01) this.vx = 0;
    if (Math.abs(this.vy) < 0.01) this.vy = 0;

    // 위치 업데이트
    this.x += this.vx;
    this.y += this.vy;

    // 화면 경계 체크
    this.checkBoundary(canvasWidth, canvasHeight);
  }

  checkBoundary(width, height) {
    if (this.x < this.radius) {
      this.x = this.radius;
      this.vx *= -1;
    } else if (this.x > width - this.radius) {
      this.x = width - this.radius;
      this.vx *= -1;
    }

    if (this.y < this.radius) {
      this.y = this.radius;
      this.vy *= -1;
    } else if (this.y > height - this.radius) {
      this.y = height - this.radius;
      this.vy *= -1;
    }
  }

  draw(ctx) {
    let c = this.color;

    if (this.hitTimer > 0) {
      c = invertColor(this.color);
    }

    ctx.fillStyle = `rgb(${c.r}, ${c.g}, ${c.b})`;
    ctx.beginPath();
    ctx.arc(this.x, this.y, this.radius, 0, Math.PI * 2);
    ctx.fill();
    ctx.closePath();
  }
}

// 유틸리티 함수
function isColliding(a, b) {
  const dx = a.x - b.x;
  const dy = a.y - b.y;
  return Math.hypot(dx, dy) < a.radius + b.radius;
}

function invertColor(c) {
  return {
    r: 255 - c.r,
    g: 255 - c.g,
    b: 255 - c.b
  };
}

function drawUI() {
  ctx.fillStyle = 'black';
  ctx.font = "20px Arial";
  ctx.textAlign = "left";
  ctx.fillText(`P1 HP: ${p1.hp}`, 50, 30);
  ctx.fillText(`P2 HP: ${p2.hp}`, 50, 60);
}

/*
  플레이어 클래스
*/
class Player extends GameObject {
  constructor(x, y, color, controls) {
    super(x, y, color);
    this.controls = controls;
    this.hp = 5;
    this.cooldown = 0;
    this.hitTimer = 0;
  }

  handleInput(keys) {
    let dx = 0;
    let dy = 0;

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
    if (this.cooldown > 0) return;
    this.cooldown = 50;
    const speed = 24;
    bullets.push(
      new Bullet(this.x, this.y, 
        this.dir.x * speed, 
        this.dir.y * speed, 
        this.color, 
        this
      )
    );
  }

  update(canvasWidth, canvasHeight) {
    super.update(canvasWidth, canvasHeight);
    if (this.cooldown > 0) this.cooldown--;
    if (this.hitTimer > 0) this.hitTimer--;
  }
}

/*
  불렛 클래스
*/
class Bullet extends GameObject {
  constructor(x, y, vx, vy, color, owner) {
    super(x, y, color);
    this.vx = vx;
    this.vy = vy;
    this.radius = 5;
    this.life = 1000;
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

// 인스턴스 생성
const p1 = new Player(100, 300, { r: 0, g: 0, b: 255 }, {
  up: 'w', down: 's', left: 'a', right: 'd', shoot: 'f'
});

const p2 = new Player(1400, 600, { r: 255, g: 0, b: 0 }, {
  up: 'arrowup', down: 'arrowdown', left: 'arrowleft', right: 'arrowright', shoot: '9'
});

const keys = {};
const bullets = [];

/*
  메인 게임 루프
*/
function gameLoop() {
  if (!gameStarted) {
    drawStartScreen();
    requestAnimationFrame(gameLoop);
    return;
  }

  ctx.clearRect(0, 0, canvas.width, canvas.height);

  if (!gameOver) {
    p1.handleInput(keys);
    p1.update(canvas.width, canvas.height);

    p2.handleInput(keys);
    p2.update(canvas.width, canvas.height);

    if (keys[p1.controls.shoot]) p1.shoot(bullets);
    if (keys[p2.controls.shoot]) p2.shoot(bullets);

    // 총알 업데이트 및 충돌 체크
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
          player.vx += b.vx * 0.4; // 넉백
          player.vy += b.vy * 0.4;
          player.hitTimer = 10;
          bullets.splice(i, 1);
          break;
        }
      }
    }

    // 승패 체크
    if (p1.hp <= 0 || p2.hp <= 0) {
      gameOver = true;
      winner = p1.hp <= 0 ? "P2" : "P1";
    }
  }

  // 그리기
  p1.draw(ctx);
  p2.draw(ctx);
  bullets.forEach(b => b.draw(ctx));
  drawUI();

  if (gameOver) {
    drawGameOver();
  }

  requestAnimationFrame(gameLoop);
}

function drawGameOver() {
  ctx.fillStyle = "rgba(0, 0, 0, 0.5)";
  ctx.fillRect(0, 0, canvas.width, canvas.height);
  
  ctx.fillStyle = "white";
  ctx.font = "60px Arial";
  ctx.textAlign = "center";
  ctx.fillText(`${winner} WIN!`, canvas.width / 2, canvas.height / 2);

  ctx.font = "25px Arial";
  ctx.fillText("Press R to Restart", canvas.width / 2, canvas.height / 2 + 50);
}

// 이벤트 리스너
window.addEventListener('keydown', e => {
  const key = e.key.toLowerCase();
  keys[key] = true;

  if (!gameStarted) gameStarted = true;
  if (gameOver && key === 'r') resetGame();
});

window.addEventListener('keyup', e => {
  keys[e.key.toLowerCase()] = false;
});

// 게임 시작
gameLoop();
