/**
 * 1. 환경 설정 및 캔버스 초기화
 */
const canvas = document.getElementById('gameCanvas');
const ctx = canvas.getContext('2d');

canvas.width = 1500;
canvas.height = 900;

/**
 * 2. 게임 객체 최상위 클래스
 */
class GameObject {
  constructor(x, y, color) {
    this.x = x;
    this.y = y;
    this.vx = 0;           // x축 속도
    this.vy = 0;           // y축 속도
    this.accel = 0.5;      // 가속도 힘
    this.friction = 0.92;  // 마찰력 (1에 가까울수록 미끄러짐)
    this.maxSpeed = 6;     // 최대 이동 속도
    this.color = color;
    this.radius = 15;      // 충돌 판정용 반지름
  }

  // 물리 시뮬레이션 업데이트
  update(canvasWidth, canvasHeight) {
    // 마찰력 적용 (매 프레임 속도 점진적 감소)
    this.vx *= this.friction;
    this.vy *= this.friction;

    // 미세 움직임 멈추기 (정지 상태에서 떨림 방지)
    if (Math.abs(this.vx) < 0.01) this.vx = 0;
    if (Math.abs(this.vy) < 0.01) this.vy = 0;

    // 위치 업데이트
    this.x += this.vx;
    this.y += this.vy;

    // 화면 경계 체크 및 반사 (벽 튕기기 효과)
    this.checkBoundary(canvasWidth, canvasHeight);
  }

  checkBoundary(width, height) {
    // 좌우 벽 충돌
    if (this.x < this.radius) {
      this.x = this.radius;
      this.vx *= -0.5;
    } else if (this.x > width - this.radius) {
      this.x = width - this.radius;
      this.vx *= -0.5;
    }

    // 상하 벽 충돌
    if (this.y < this.radius) {
      this.y = this.radius;
      this.vy *= -0.5;
    } else if (this.y > height - this.radius) {
      this.y = height - this.radius;
      this.vy *= -0.5;
    }
  }

  // 화면에 그리기
  draw(ctx) {
    ctx.fillStyle = this.color;
    ctx.beginPath();
    ctx.arc(this.x, this.y, this.radius, 0, Math.PI * 2);
    ctx.fill();
    ctx.closePath();
  }
}

/**
 * 3. 플레이어 클래스 (GameObject 상속)
 */
class Player extends GameObject {
  constructor(x, y, color, controls) {
    super(x, y, color);
    this.controls = controls; // 조작키 설정 { up, down, left, right }
  }

  handleInput(keys) {
    // 방향키 입력에 따른 가속
    if (keys[this.controls.up])    this.vy -= this.accel;
    if (keys[this.controls.down])  this.vy += this.accel;
    if (keys[this.controls.left])  this.vx -= this.accel;
    if (keys[this.controls.right]) this.vx += this.accel;

    // 최대 속도 제한
    this.vx = Math.max(-this.maxSpeed, Math.min(this.maxSpeed, this.vx));
    this.vy = Math.max(-this.maxSpeed, Math.min(this.maxSpeed, this.vy));
  }
}

/**
 * 4. 인스턴스 생성 및 상태 관리
 */
const p1 = new Player(100, 300, 'blue', { 
  up: 'w', down: 's', left: 'a', right: 'd' 
});

const p2 = new Player(700, 300, 'red', { 
  up: 'ArrowUp', down: 'ArrowDown', left: 'ArrowLeft', right: 'ArrowRight' 
});

const keys = {}; // 눌린 키 상태 저장 객체

/**
 * 5. 메인 게임 루프
 */
function gameLoop() {
  // 1) 화면 초기화
  ctx.clearRect(0, 0, canvas.width, canvas.height);

  // 2) 데이터 업데이트 (입력 -> 물리)
  p1.handleInput(keys);
  p1.update(canvas.width, canvas.height);

  p2.handleInput(keys);
  p2.update(canvas.width, canvas.height);

  // 3) 렌더링
  p1.draw(ctx);
  p2.draw(ctx);

  // 다음 프레임 예약
  requestAnimationFrame(gameLoop);
}

/**
 * 6. 이벤트 리스너 등록
 */
window.addEventListener('keydown', e => { keys[e.key] = true; });
window.addEventListener('keyup', e => { keys[e.key] = false; });

// 게임 시작
gameLoop();
