// 모든 물체의 부모
class GameObject {
    constructor(x, y, color) {
        this.x = x;
        this.y = y;
        this.vx = 0; // x축 속도
        this.vy = 0; // y축 속도
        this.accel = 0.5; // 가속도 힘
        this.friction = 0.92; // 마찰력 (1에 가까울수록 미끄러짐)
        this.maxSpeed = 6;
        this.color = color;
        this.radius = 15; // 충돌 판정용 반지름
    }

    // 물리 업데이트 로직
    update() {
        // 1. 마찰력 적용 (매 프레임 속도 감소)
        this.vx *= this.friction;
        this.vy *= this.friction;

        // 2. 위치 업데이트
        this.x += this.vx;
        this.y += this.vy;
    }

    // 화면에 그리기
    draw(ctx) {
        ctx.fillStyle = this.color;
        ctx.beginPath();
        ctx.arc(this.x, this.y, this.radius, 0, Math.PI * 2);
        ctx.fill();
    }
}
// Player (GameObject 상속)
class Player extends GameObject {
    constructor(x, y, color, controls) {
        super(x, y, color);
        this.controls = controls; // { up: 'w', down: 's', ... }
    }

    handleInput(keys) {
        if (keys[this.controls.up]) this.vy -= this.accel;
        if (keys[this.controls.down]) this.vy += this.accel;
        if (keys[this.controls.left]) this.vx -= this.accel;
        if (keys[this.controls.right]) this.vx += this.accel;

        // 속도 제한 (Magnitude 사용 권장하지만 간단히 처리)
        if (this.vx > this.maxSpeed) this.vx = this.maxSpeed;
        if (this.vx < -this.maxSpeed) this.vx = -this.maxSpeed;
        if (this.vy > this.maxSpeed) this.vx = this.maxSpeed;
        if (this.vy < -this.maxSpeed) this.vx = -this.maxSpeed;
    }
}
// requestAnimationFrame : 브라우저 전용 루프 함수
const canvas = document.getElementById('gameCanvas');
const ctx = canvas.getContext('2d');

const p1 = new Player(100, 300, 'blue', { up: 'w', down: 's', left: 'a', right: 'd' });
const p2 = new Player(700, 300, 'red', { up: 'ArrowUp', down: 'ArrowDown', left: 'ArrowLeft', right: 'ArrowRight' });

const keys = {}; // 눌린 키를 저장할 객체

function gameLoop() {
    // 1. 화면 지우기
    ctx.clearRect(0, 0, canvas.width, canvas.height);

    // 2. 입력 처리 및 업데이트
    p1.handleInput(keys);
    p1.update();
    
    p2.handleInput(keys);
    p2.update();

    // 3. 그리기
    p1.draw(ctx);
    p2.draw(ctx);

    requestAnimationFrame(gameLoop); // 다음 프레임 예약
}

// 키보드 이벤트 리스너
window.addEventListener('keydown', e => keys[e.key] = true);
window.addEventListener('keyup', e => keys[e.key] = false);

gameLoop();


