const canvas = document.getElementById('tetris');
const context = canvas.getContext('2d');

// 描画サイズ設定（1ブロック = 20px、フィールド 12x20）
context.scale(20, 20);

// テトリミノの色
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

// テトリミノの形状データ
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

// フィールド作成 (幅12, 高さ20)
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
  score: 0,
  lines: 0,
};

// 衝突判定
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

// 固まったブロックをフィールドに記録
function merge(arena, player) {
  player.matrix.forEach((row, y) => {
    row.forEach((value, x) => {
      if (value !== 0) {
        arena[y + player.pos.y][x + player.pos.x] = value;
      }
    });
  });
}

// 行の削除チェックとスコア計算
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

// 行列の回転
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

// プレイヤーの回転（壁すり抜け防止補正付き）
function playerRotate(dir) {
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

// ピースの横移動
function playerMove(dir) {
  player.pos.x += dir;
  if (collide(arena, player)) {
    player.pos.x -= dir;
  }
}

// ピースの生成・ゲームオーバー判定
function playerReset() {
  const pieces = 'ILJOTSZ';
  player.matrix = createPiece(pieces[pieces.length * Math.random() | 0]);
  player.pos.y = 0;
  player.pos.x = (arena[0].length / 2 | 0) - (player.matrix[0].length / 2 | 0);

  if (collide(arena, player)) {
    arena.forEach(row => row.fill(0));
    player.score = 0;
    player.lines = 0;
    updateScore();
  }
}

// 落下処理
function playerDrop() {
  player.pos.y++;
  if (collide(arena, player)) {
    player.pos.y--;
    merge(arena, player);
    playerReset();
    arenaSweep();
  }
  dropCounter = 0;
}

// 一気に一番下まで落とす（ハードドロップ）
function playerHardDrop() {
  while (!collide(arena, player)) {
    player.pos.y++;
  }
  player.pos.y--;
  merge(arena, player);
  playerReset();
  arenaSweep();
  dropCounter = 0;
}

// 描画処理
function draw() {
  context.fillStyle = '#000';
  context.fillRect(0, 0, canvas.width, canvas.height);

  drawMatrix(arena, {x: 0, y: 0});
  drawMatrix(player.matrix, player.pos);
}

function drawMatrix(matrix, offset) {
  matrix.forEach((row, y) => {
    row.forEach((value, x) => {
      if (value !== 0) {
        context.fillStyle = colors[value];
        context.fillRect(x + offset.x, y + offset.y, 1, 1);
        
        context.lineWidth = 0.05;
        context.strokeStyle = '#000';
        context.strokeRect(x + offset.x, y + offset.y, 1, 1);
      }
    });
  });
}

function updateScore() {
  document.getElementById('score').innerText = player.score;
  document.getElementById('lines').innerText = player.lines;
}

// ゲームループ
let dropCounter = 0;
let dropInterval = 1000;
let lastTime = 0;

function update(time = 0) {
  const deltaTime = time - lastTime;
  lastTime = time;

  dropCounter += deltaTime;
  if (dropCounter > dropInterval) {
    playerDrop();
  }

  draw();
  requestAnimationFrame(update);
}

// キー入力イベント
document.addEventListener('keydown', event => {
  if (event.keyCode === 37) { // Left Arrow
    playerMove(-1);
  } else if (event.keyCode === 39) { // Right Arrow
    playerMove(1);
  } else if (event.keyCode === 40) { // Down Arrow
    playerDrop();
  } else if (event.keyCode === 38 || event.keyCode === 88) { // Up Arrow or X
    playerRotate(1);
  } else if (event.keyCode === 90) { // Z
    playerRotate(-1);
  } else if (event.keyCode === 32) { // Space
    playerHardDrop();
  }
});

// 初期化と開始
playerReset();
updateScore();
update();
