const canvas = document.querySelector("#game");
const ctx = canvas.getContext("2d");

const ui = {
  floor: document.querySelector("#floor"),
  hp: document.querySelector("#hp"),
  atk: document.querySelector("#atk"),
  gold: document.querySelector("#gold"),
  best: document.querySelector("#best"),
  log: document.querySelector("#log"),
  start: document.querySelector("#start"),
  restart: document.querySelector("#restart"),
  wait: document.querySelector("#wait"),
  title: document.querySelector("#titleScreen"),
};

const tile = 32;
const cols = 30;
const rows = 20;
const bestKey = "deep-dungeon-best";
const floorTile = 0;
const wallTile = 1;

let bestFloor = Number(localStorage.getItem(bestKey) || 1);
let running = false;
let gameOver = false;
let dungeon = [];
let rooms = [];
let enemies = [];
let chests = [];
let stair = { x: 1, y: 1 };
let turn = 0;

const hero = {
  x: 1,
  y: 1,
  hp: 24,
  maxHp: 24,
  atk: 5,
  gold: 0,
  floor: 1,
};

function rand(max) {
  return Math.floor(Math.random() * max);
}

function clamp(value, min, max) {
  return Math.max(min, Math.min(max, value));
}

function addLog(text) {
  const line = document.createElement("div");
  line.textContent = text;
  ui.log.prepend(line);
  while (ui.log.children.length > 4) ui.log.lastChild.remove();
}

function isWall(x, y) {
  return x < 0 || y < 0 || x >= cols || y >= rows || dungeon[y][x] === wallTile;
}

function entityAt(list, x, y) {
  return list.find((item) => item.x === x && item.y === y);
}

function carveRect(room) {
  for (let y = room.y; y < room.y + room.h; y += 1) {
    for (let x = room.x; x < room.x + room.w; x += 1) dungeon[y][x] = floorTile;
  }
}

function carveLine(x1, y1, x2, y2) {
  let x = x1;
  let y = y1;
  while (x !== x2) {
    dungeon[y][x] = floorTile;
    x += Math.sign(x2 - x);
  }
  while (y !== y2) {
    dungeon[y][x] = floorTile;
    y += Math.sign(y2 - y);
  }
  dungeon[y][x] = floorTile;
}

function center(room) {
  return {
    x: Math.floor(room.x + room.w / 2),
    y: Math.floor(room.y + room.h / 2),
  };
}

function overlaps(candidate) {
  return rooms.some((room) => (
    candidate.x < room.x + room.w + 1 &&
    candidate.x + candidate.w + 1 > room.x &&
    candidate.y < room.y + room.h + 1 &&
    candidate.y + candidate.h + 1 > room.y
  ));
}

function randomFloorCell(avoidStart = true) {
  for (let tries = 0; tries < 800; tries += 1) {
    const room = rooms[rand(rooms.length)];
    const x = room.x + 1 + rand(Math.max(1, room.w - 2));
    const y = room.y + 1 + rand(Math.max(1, room.h - 2));
    const farEnough = !avoidStart || Math.abs(x - hero.x) + Math.abs(y - hero.y) > 8;
    if (
      farEnough &&
      !entityAt(enemies, x, y) &&
      !entityAt(chests, x, y) &&
      !(stair.x === x && stair.y === y)
    ) return { x, y };
  }
  return center(rooms.at(-1));
}

function makeDungeon() {
  dungeon = Array.from({ length: rows }, () => Array(cols).fill(wallTile));
  rooms = [];

  for (let i = 0; i < 80 && rooms.length < 8; i += 1) {
    const room = {
      w: 4 + rand(6),
      h: 4 + rand(5),
      x: 1 + rand(cols - 10),
      y: 1 + rand(rows - 8),
    };
    if (room.x + room.w >= cols - 1 || room.y + room.h >= rows - 1 || overlaps(room)) continue;
    carveRect(room);
    if (rooms.length > 0) {
      const prev = center(rooms.at(-1));
      const next = center(room);
      if (rand(2) === 0) carveLine(prev.x, prev.y, next.x, next.y);
      else carveLine(next.x, prev.y, next.x, next.y), carveLine(prev.x, prev.y, next.x, prev.y);
    }
    rooms.push(room);
  }

  if (rooms.length < 2) makeDungeon();
}

function spawnFloor() {
  makeDungeon();
  enemies = [];
  chests = [];

  const start = center(rooms[0]);
  hero.x = start.x;
  hero.y = start.y;

  stair = center(rooms.at(-1));
  const enemyCount = clamp(3 + hero.floor, 4, 13);
  const chestCount = clamp(2 + Math.floor(hero.floor / 2), 2, 7);

  for (let i = 0; i < enemyCount; i += 1) {
    const pos = randomFloorCell(true);
    enemies.push({
      x: pos.x,
      y: pos.y,
      hp: 8 + hero.floor * 3 + rand(5),
      atk: 2 + Math.floor(hero.floor / 2) + rand(2),
    });
  }

  for (let i = 0; i < chestCount; i += 1) {
    chests.push(randomFloorCell(true));
  }
}

function startGame() {
  hero.hp = 24;
  hero.maxHp = 24;
  hero.atk = 5;
  hero.gold = 0;
  hero.floor = 1;
  turn = 0;
  running = true;
  gameOver = false;
  ui.title.classList.add("hidden");
  ui.log.textContent = "";
  spawnFloor();
  addLog("地下1階へ降りた。");
  updateHud();
  draw();
}

function restartGame() {
  ui.title.classList.remove("hidden");
  running = false;
  gameOver = false;
  drawTitle();
}

function damageHero(amount) {
  hero.hp = Math.max(0, hero.hp - amount);
  if (hero.hp <= 0) {
    gameOver = true;
    running = false;
    ui.title.classList.remove("hidden");
    ui.title.querySelector("h1").textContent = "Game Over";
    ui.title.querySelector("p").textContent = `${hero.floor}Fまで到達。Startで再挑戦できます。`;
    addLog("力尽きた。");
  }
}

function collectChest(chest) {
  chests = chests.filter((item) => item !== chest);
  const roll = rand(4);
  if (roll === 0) {
    const heal = 6 + rand(8);
    hero.hp = Math.min(hero.maxHp, hero.hp + heal);
    addLog(`薬を見つけた。HP +${heal}`);
  } else if (roll === 1) {
    hero.atk += 1;
    addLog("剣が少し鋭くなった。ATK +1");
  } else if (roll === 2) {
    hero.maxHp += 3;
    hero.hp += 3;
    addLog("命の実を食べた。最大HP +3");
  } else {
    const gold = 12 + rand(18) + hero.floor * 2;
    hero.gold += gold;
    addLog(`金貨を手に入れた。+${gold}`);
  }
}

function attack(enemy) {
  const damage = hero.atk + rand(4);
  enemy.hp -= damage;
  addLog(`敵に${damage}ダメージ。`);
  if (enemy.hp <= 0) {
    enemies = enemies.filter((item) => item !== enemy);
    const gold = 3 + rand(6) + hero.floor;
    hero.gold += gold;
    addLog(`敵を倒した。金貨 +${gold}`);
  }
}

function nextFloor() {
  hero.floor += 1;
  bestFloor = Math.max(bestFloor, hero.floor);
  localStorage.setItem(bestKey, String(bestFloor));
  hero.hp = Math.min(hero.maxHp, hero.hp + 5);
  spawnFloor();
  addLog(`地下${hero.floor}階へ進んだ。`);
}

function moveHero(dx, dy) {
  if (!running || gameOver) return;

  const nx = hero.x + dx;
  const ny = hero.y + dy;
  if (isWall(nx, ny)) {
    addLog("壁に阻まれた。");
    updateHud();
    draw();
    return;
  }

  const enemy = entityAt(enemies, nx, ny);
  if (enemy) attack(enemy);
  else {
    hero.x = nx;
    hero.y = ny;
    const chest = entityAt(chests, nx, ny);
    if (chest) collectChest(chest);
    if (stair.x === nx && stair.y === ny) {
      nextFloor();
      updateHud();
      draw();
      return;
    }
  }

  turn += 1;
  enemiesAct();
  updateHud();
  draw();
}

function waitTurn() {
  if (!running || gameOver) return;
  addLog("息を整えた。");
  turn += 1;
  enemiesAct();
  updateHud();
  draw();
}

function canEnemyEnter(x, y, self) {
  return !isWall(x, y) &&
    !entityAt(enemies.filter((enemy) => enemy !== self), x, y) &&
    !(hero.x === x && hero.y === y);
}

function enemyStep(enemy) {
  const distance = Math.abs(enemy.x - hero.x) + Math.abs(enemy.y - hero.y);
  if (distance === 1) {
    const damage = enemy.atk + rand(3);
    damageHero(damage);
    addLog(`攻撃を受けた。-${damage} HP`);
    return;
  }

  if (distance > 8 && rand(3) !== 0) return;

  const options = [
    { dx: Math.sign(hero.x - enemy.x), dy: 0 },
    { dx: 0, dy: Math.sign(hero.y - enemy.y) },
    { dx: rand(3) - 1, dy: 0 },
    { dx: 0, dy: rand(3) - 1 },
  ].filter((step) => step.dx !== 0 || step.dy !== 0);

  options.sort((a, b) => {
    const da = Math.abs(enemy.x + a.dx - hero.x) + Math.abs(enemy.y + a.dy - hero.y);
    const db = Math.abs(enemy.x + b.dx - hero.x) + Math.abs(enemy.y + b.dy - hero.y);
    return da - db;
  });

  for (const step of options) {
    const nx = enemy.x + step.dx;
    const ny = enemy.y + step.dy;
    if (canEnemyEnter(nx, ny, enemy)) {
      enemy.x = nx;
      enemy.y = ny;
      return;
    }
  }
}

function enemiesAct() {
  for (const enemy of [...enemies]) {
    if (!running || gameOver) break;
    enemyStep(enemy);
  }
}

function updateHud() {
  ui.floor.textContent = `${hero.floor}F`;
  ui.hp.textContent = `${hero.hp}/${hero.maxHp}`;
  ui.atk.textContent = hero.atk;
  ui.gold.textContent = hero.gold;
  ui.best.textContent = `${bestFloor}F`;
}

function drawTile(x, y, color) {
  ctx.fillStyle = color;
  ctx.fillRect(x * tile, y * tile, tile, tile);
}

function drawDungeon() {
  ctx.fillStyle = "#050607";
  ctx.fillRect(0, 0, canvas.width, canvas.height);

  for (let y = 0; y < rows; y += 1) {
    for (let x = 0; x < cols; x += 1) {
      if (dungeon[y][x] === wallTile) {
        drawTile(x, y, "#252831");
        ctx.fillStyle = "rgba(255,255,255,0.035)";
        ctx.fillRect(x * tile + 2, y * tile + 2, tile - 4, 3);
      } else {
        drawTile(x, y, "#141820");
        ctx.fillStyle = (x + y) % 2 === 0 ? "#181d25" : "#12161d";
        ctx.fillRect(x * tile + 1, y * tile + 1, tile - 2, tile - 2);
      }
    }
  }
}

function drawStair() {
  const x = stair.x * tile;
  const y = stair.y * tile;
  ctx.fillStyle = "#6f5a31";
  ctx.fillRect(x + 6, y + 7, 20, 18);
  ctx.fillStyle = "#f2c14e";
  ctx.fillRect(x + 8, y + 9, 16, 3);
  ctx.fillRect(x + 10, y + 15, 12, 3);
  ctx.fillRect(x + 12, y + 21, 8, 3);
}

function drawChest(chest) {
  const x = chest.x * tile;
  const y = chest.y * tile;
  ctx.fillStyle = "#8f5a2b";
  ctx.fillRect(x + 6, y + 12, 20, 14);
  ctx.fillStyle = "#d89f42";
  ctx.fillRect(x + 6, y + 9, 20, 7);
  ctx.fillStyle = "#f6d670";
  ctx.fillRect(x + 14, y + 13, 4, 7);
}

function drawEnemy(enemy) {
  const x = enemy.x * tile;
  const y = enemy.y * tile;
  ctx.fillStyle = "#9b4c66";
  ctx.fillRect(x + 7, y + 8, 18, 18);
  ctx.fillStyle = "#ffced8";
  ctx.fillRect(x + 11, y + 13, 4, 4);
  ctx.fillRect(x + 18, y + 13, 4, 4);
  ctx.fillStyle = "#2b1018";
  ctx.fillRect(x + 10, y + 23, 12, 2);
}

function drawHero() {
  const x = hero.x * tile;
  const y = hero.y * tile;
  ctx.fillStyle = "#4bc489";
  ctx.fillRect(x + 8, y + 8, 16, 18);
  ctx.fillStyle = "#f5f0e7";
  ctx.fillRect(x + 10, y + 5, 12, 9);
  ctx.fillStyle = "#26313c";
  ctx.fillRect(x + 13, y + 9, 2, 2);
  ctx.fillRect(x + 18, y + 9, 2, 2);
  ctx.fillStyle = "#f2c14e";
  ctx.fillRect(x + 22, y + 12, 4, 14);
}

function drawVignette() {
  const gx = hero.x * tile + tile / 2;
  const gy = hero.y * tile + tile / 2;
  const gradient = ctx.createRadialGradient(gx, gy, 70, gx, gy, 430);
  gradient.addColorStop(0, "rgba(0,0,0,0)");
  gradient.addColorStop(0.72, "rgba(0,0,0,0.16)");
  gradient.addColorStop(1, "rgba(0,0,0,0.58)");
  ctx.fillStyle = gradient;
  ctx.fillRect(0, 0, canvas.width, canvas.height);
}

function drawTitle() {
  ctx.fillStyle = "#090a0c";
  ctx.fillRect(0, 0, canvas.width, canvas.height);
  ctx.fillStyle = "#252831";
  for (let y = 0; y < rows; y += 1) {
    for (let x = 0; x < cols; x += 1) {
      if ((x * 7 + y * 11) % 5 === 0) ctx.fillRect(x * tile, y * tile, tile - 1, tile - 1);
    }
  }
}

function draw() {
  if (!running && !gameOver) {
    drawTitle();
    updateHud();
    return;
  }
  drawDungeon();
  drawStair();
  chests.forEach(drawChest);
  enemies.forEach(drawEnemy);
  drawHero();
  drawVignette();
}

ui.start.addEventListener("click", () => {
  ui.title.querySelector("h1").textContent = "Deep Dungeon";
  ui.title.querySelector("p").textContent = "Startを押すと冒険開始。敵を倒し、宝箱を拾い、階段から深く潜ります。";
  startGame();
});
ui.restart.addEventListener("click", restartGame);
ui.wait.addEventListener("click", waitTurn);

document.querySelectorAll("[data-dir]").forEach((button) => {
  button.addEventListener("click", () => {
    const dir = button.dataset.dir;
    if (dir === "up") moveHero(0, -1);
    if (dir === "down") moveHero(0, 1);
    if (dir === "left") moveHero(-1, 0);
    if (dir === "right") moveHero(1, 0);
  });
});

window.addEventListener("keydown", (event) => {
  const keys = {
    ArrowUp: [0, -1],
    ArrowDown: [0, 1],
    ArrowLeft: [-1, 0],
    ArrowRight: [1, 0],
    KeyW: [0, -1],
    KeyS: [0, 1],
    KeyA: [-1, 0],
    KeyD: [1, 0],
  };
  if (keys[event.code]) {
    event.preventDefault();
    moveHero(keys[event.code][0], keys[event.code][1]);
  }
  if (event.code === "Space") {
    event.preventDefault();
    waitTurn();
  }
  if (event.code === "Enter" && !running) startGame();
});

updateHud();
drawTitle();
