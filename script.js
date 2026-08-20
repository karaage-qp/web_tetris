const canvas = document.getElementById('tetris');
const context = canvas.getContext('2d');
context.scale(20, 20);

// NEXT表示用キャンバスの設定
const nextCanvas = document.getElementById('next');
const nextContext = nextCanvas.getContext('2d');
nextContext.scale(20, 20);

const overlay = document.getElementById('game-over-overlay');
const restartBtn = document.getElementById('restart-btn');

const colors = [
  null,
  '#FF0D72', // T
  '#0DC2FF', // I
  '#0DFF72', // S
  '#F538FF', // Z
  '#FF8E0D', // L
  '#FFE138', // J
  '#3877FF', // O
];

function createPiece(type) {
  if (type === 'I') {
    return [
      [0, 1, 0, 0],
      [0, 1, 0, 0],
      [0, 1, 0, 0],
      [0, 1, 0, 0],
    ];
  } else if (type === 'L') {
    return [
      [0, 2, 0],
      [0, 2, 0],
      [0, 2, 2],
    ];
  } else if (type === 'J') {
    return [
      [0, 3, 0],
      [0, 3, 0],
      [3, 3, 0],
    ];
  } else if (type === 'O') {
    return [
      [4, 4],
      [4, 4],
    ];
  } else if (type === 'Z') {
    return [
      [5, 5, 0],
      [0, 5, 5],
      [0, 0, 0],
    ];
  } else if (type === 'S') {
    return [
      [0, 6, 6],
      [6, 6, 0],
      [0, 0, 0],
    ];
  } else if (type === 'T') {
    return [
      [0, 7, 0],
      [7, 7, 7],
      [0, 0, 0],
    ];
  }
}

function getRandomPieceType() {
  const pieces = 'ILJOTSZ';
  return pieces[pieces.length * Math.random() | 0];
}

function createMatrix(w, h) {
  const matrix = [];
  while (h--) {
    matrix.push(new Array(w).fill(0));
  }
  return matrix;
}

const arena = createMatrix(12, 20);

const player = {
  pos: {x: 0, y: 0},
  matrix: null,
  nextMatrix: null,
  score: 0,
  lines: 0,
};

let isGameOver = false;

function collide(arena, player) {
  const [m, o] = [player.matrix, player.pos];
  for (let y = 0; y < m.length; ++y) {
    for (let x = 0; x < m[y].length; ++x) {
      if (m[y][x] !== 0 &&
         (arena[y + o.y] && arena[y + o.y][x + o.x]) !== 0) {
        return true;
      }
    }
  }
  return false;
}

function merge(arena, player) {
  player.matrix.forEach((row, y) => {
    row.forEach((value, x) => {
      if (value !== 0) {
        arena[y + player.pos.y][x + player.pos.x] = value;
      }
    });
  });
}

function arenaSweep() {
  let rowCount = 1;
  outer: for (let y = arena.length - 1; y >= 0; --y) {
    for (let x = 0; x < arena[y].length; ++x) {
      if (arena[y][x] === 0) {
        continue outer;
      }
    }
    const row = arena.splice(y, 1)[0].fill(0);
    arena.unshift(row);
    ++y;

    player.score += rowCount * 10;
    player.lines += 1;
    rowCount *= 2;
  }
  updateScore();
}

function rotate(matrix, dir) {
  for (let y = 0; y < matrix.length; ++y) {
    for (let x = 0; x < y; ++x) {
      [matrix[x][y], matrix[y][x]] = [matrix[y][x], matrix[x][y]];
    }
  }
  if (dir > 0) {
    matrix.forEach(row => row.reverse());
  } else {
    matrix.reverse();
  }
}

function playerRotate(dir) {
  if (isGameOver) return;
  const pos = player.pos.x;
  let offset = 1;
  rotate(player.matrix, dir);
  while (collide(arena, player)) {
    player.pos.x += offset;
    offset = -(offset + (offset > 0 ? 1 : -1));
    if (offset > player.matrix[0].length) {
      rotate(player.matrix, -dir);
      player.pos.x = pos;
      return;
    }
  }
}

function playerMove(dir) {
  if (isGameOver) return;
  player.pos.x += dir;
  if (collide(arena, player)) {
    player.pos.x -= dir;
  }
}

// ピースのセット・生成処理
function playerReset() {
  // 初回呼び出し時にNEXTミノを作成
  if (!player.nextMatrix) {
    player.nextMatrix = createPiece(getRandomPieceType());
  }

  // NEXTミノを現在のミノに設定し、新しいNEXTミノを決定
  player.matrix = player.nextMatrix;
  player.nextMatrix = createPiece(getRandomPieceType());

  player.pos.y = 0;
  player.pos.x = (arena[0].length / 2 | 0) - (player.matrix[0].length / 2 | 0);

  // 出現直後に衝突した場合はゲームオーバー
  if (collide(arena, player)) {
    isGameOver = true;
    overlay.classList.remove('hidden');
  }

  drawNext();
}

function playerDrop() {
  if (isGameOver) return;
  player.pos.y++;
  if (collide(arena, player)) {
    player.pos.y--;
    merge(arena, player);
    playerReset();
    arenaSweep();
  }
  dropCounter = 0;
}

function playerHardDrop() {
  if (isGameOver) return;
  while (!collide(arena, player)) {
    player.pos.y++;
  }
  player.pos.y--;
  merge(arena, player);
  playerReset();
  arenaSweep();
  dropCounter = 0;
}

// メインフィールド描画
function draw() {
  context.fillStyle = '#000';
  context.fillRect(0, 0, canvas.width, canvas.height);

  drawMatrix(context, arena, {x: 0, y: 0});
  if (!isGameOver) {
    drawMatrix(context, player.matrix, player.pos);
  }
}

// NEXT画面描画
function drawNext() {
  nextContext.fillStyle = '#000';
  nextContext.fillRect(0, 0, nextCanvas.width, nextCanvas.height);

  // NEXTキャンバスの中央付近に配置されるようにオフセット計算
  const offsetX = (4 - player.nextMatrix[0].length) / 2;
  const offsetY = (4 - player.nextMatrix.length) / 2;

  drawMatrix(nextContext, player.nextMatrix, {x: offsetX, y: offsetY});
}

function drawMatrix(ctx, matrix, offset) {
  matrix.forEach((row, y) => {
    row.forEach((value, x) => {
      if (value !== 0) {
        ctx.fillStyle = colors[value];
        ctx.fillRect(x + offset.x, y + offset.y, 1, 1);
        
        ctx.lineWidth = 0.05;
        ctx.strokeStyle = '#000';
        ctx.strokeRect(x + offset.x, y + offset.y, 1, 1);
      }
    });
  });
}

function updateScore() {
  document.getElementById('score').innerText = player.score;
  document.getElementById('lines').innerText = player.lines;
}

// ゲーム再スタート処理
function restartGame() {
  arena.forEach(row => row.fill(0));
  player.score = 0;
  player.lines = 0;
  isGameOver = false;
  player.nextMatrix = null;
  
  overlay.classList.add('hidden');
  
  updateScore();
  playerReset();
  update();
}

restartBtn.addEventListener('click', restartGame);

let dropCounter = 0;
let dropInterval = 1000;
let lastTime = 0;

function update(time = 0) {
  if (isGameOver) return;

  const deltaTime = time - lastTime;
  lastTime = time;

  dropCounter += deltaTime;
  if (dropCounter > dropInterval) {
    playerDrop();
  }

  draw();
  requestAnimationFrame(update);
}

document.addEventListener('keydown', event => {
  if (isGameOver) return;

  if (event.keyCode === 37) { // Left
    playerMove(-1);
  } else if (event.keyCode === 39) { // Right
    playerMove(1);
  } else if (event.keyCode === 40) { // Down
    playerDrop();
  } else if (event.keyCode === 38 || event.keyCode === 88) { // Up or X
    playerRotate(1);
  } else if (event.keyCode === 90) { // Z
    playerRotate(-1);
  } else if (event.keyCode === 32) { // Space
    playerHardDrop();
  }
});

// 初期化
playerReset();
updateScore();
update();
