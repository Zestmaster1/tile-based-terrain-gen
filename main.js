const world = document.getElementById("world");
const ctx = world.getContext("2d");
world.width = 2000;
world.height = 1000;

const waterCanvas = document.getElementById("water");
const waterCtx = waterCanvas.getContext("2d");
waterCanvas.width = world.width;
waterCanvas.height = world.height;

const terrainCanvas = document.getElementById("terrain");
const terCtx = terrainCanvas.getContext("2d");
terrainCanvas.width = world.width;
terrainCanvas.height = world.height;

const grassPaletteCanvas = document.createElement("canvas");
const grassPaletteCtx = grassPaletteCanvas.getContext("2d");

const keys = {};

window.addEventListener("keydown", e => {
  keys[e.key] = true;
});

window.addEventListener("keyup", e => {
  keys[e.key] = false;
});

let camera = {
  x: 0,
  y: 0,
  speed: 10
};

const rockTexture = new Image();
rockTexture.src = "textures/rock.png";

const tree1 = new Image();
tree1.src = "textures/tree.png";

const tree2 = new Image();
tree2.src = "textures/tree2.png";

const cactus1 = new Image();
cactus1.src = "textures/cactus.png";

const cactus2 = new Image();
cactus2.src = "textures/cactus2.png";

const grassPalette = new Image();
grassPalette.src = "textures/grassColorMap.png";

const treeTextures = [tree1, tree2];
const cactusTextures = [cactus1, cactus2];

let tileSize = 20;
let grassMoisture = [0.6, 1];
let treeMoisture = [0.7, 0.9];
let cactusMoisture = [0.5, 0.6];

let grassMin = Math.min(...grassMoisture);
let grassMax = Math.max(...grassMoisture);
let treeMin = Math.min(...treeMoisture);
let treeMax = Math.max(...treeMoisture);
let cactusMin = Math.min(...cactusMoisture);
let cactusMax = Math.max(...cactusMoisture);

let tempCurve = 0.4;

let p;

function randomPaletteColor() {
  const x = Math.floor(Math.random() * grassPalette.width);
  const y = Math.floor(Math.random() * grassPalette.height);

  const pixel = grassPaletteCtx.getImageData(x, y, 1, 1).data;

  return [
    pixel[0],
    pixel[1],
    pixel[2]
  ];
}

function step() {
  requestAnimationFrame(step);

  if (keys["ArrowLeft"])  camera.x -= camera.speed;
  if (keys["ArrowRight"]) camera.x += camera.speed;
  if (keys["ArrowUp"])    camera.y -= camera.speed;
  if (keys["ArrowDown"])  camera.y += camera.speed;

  if (camera.x >= world.width)  camera.x -= world.width;
  if (camera.x < 0)             camera.x += world.width;

  if (camera.y >= world.height) camera.y -= world.height;
  if (camera.y < 0)             camera.y += world.height;

  p.step();
  draw();
}

function drawWrappedCanvas(ctx, canvas) {
  for (let ox = -world.width; ox <= world.width; ox += world.width) {
    for (let oy = -world.height; oy <= world.height; oy += world.height) {
      ctx.drawImage(
        canvas,
        ox - camera.x,
        oy - camera.y
      );
    }
  }
}

function draw() {
  ctx.clearRect(0, 0, world.width, world.height);

  // static layers
  drawWrappedCanvas(ctx, terrainCanvas);
  // drawWrappedCanvas(ctx, waterCanvas);

  drawWater();

  // grass and trees
  for (let ox = -world.width; ox <= world.width; ox += world.width) {
    for (let oy = -world.height; oy <= world.height; oy += world.height) {

      for (let row of p.allTiles) {
        for (let ind of row) {

          if (ind.grass) {
            // ctx.fillStyle = `rgba(70,255,20,${ind.grass / 4})`;
            ctx.fillStyle = `rgba(
                                  ${p.grassColor[0]},
                                  ${p.grassColor[1]},
                                  ${p.grassColor[2]},
                                  ${ind.grass / 4}
                                )`;
            ctx.fillRect(
              ind.x + ox - camera.x,
              ind.y + oy - camera.y,
              tileSize,
              tileSize
            );
          }

          if (ind.tree === "tree") {
            ctx.globalAlpha = 0.75;

            ctx.drawImage(
              treeTextures[ind.treeTex],
              ind.treeOffset.x - 8 + ox - camera.x,
              ind.treeOffset.y - 8 + oy - camera.y,
              16,
              16
            );

            ctx.globalAlpha = 1;
          }

          if (ind.tree === "cactus") {
            ctx.globalAlpha = 0.75;

            ctx.drawImage(
              cactusTextures[ind.cactusTex],
              ind.treeOffset.x - 6 + ox - camera.x,
              ind.treeOffset.y - 6 + oy - camera.y,
              12,
              12
            );

            ctx.globalAlpha = 1;
          }
        }
      }
    }
  }
}

function drawTerrain() {
  terCtx.clearRect(0, 0, world.width, world.height);
  terCtx.fillStyle = "black";
  terCtx.fillRect(0, 0, terrainCanvas.width, terrainCanvas.height);
  terCtx.globalAlpha = 0.25;
  terCtx.drawImage(rockTexture, 0, 0, terrainCanvas.width, terrainCanvas.height);
  terCtx.globalAlpha = 1;

  for (let row of p.allTiles) {
    for (let ind of row) {
      if (ind.state === "fertile") {
        terCtx.fillStyle = `rgba(255, 240, 230, ${ind.elevation})`;
      } else if (ind.state === "snow") {
        terCtx.fillStyle = `rgba(255, 255, 255, ${ind.elevation + 0.5})`;
      } else if (ind.state === "desert") {
        terCtx.fillStyle = `rgba(255, 100, 0, ${ind.elevation})`;
      }

      terCtx.fillRect(ind.x, ind.y, tileSize, tileSize);
    }
  }
}

function drawWater() {
  waterCtx.clearRect(0, 0, waterCanvas.width, waterCanvas.height);
  for (let row of p.allTiles) {
    for (let ind of row) {

      if (ind.moisture === 1) {
        if (ind.state === "snow") {
          waterCtx.fillStyle = `rgb(
                                    50,
                                    ${Math.min(1, ind.elevation * 2) * 50 + 100},
                                    ${Math.min(1, ind.elevation * 3) * 100 + 155}
                                  )`;
        } else {
          waterCtx.fillStyle = `rgb(
                                    0,
                                    20,
                                    ${Math.min(1, ind.elevation * 3) * 125 + 120}
                                  )`;
        }
        waterCtx.fillRect(ind.x, ind.y, tileSize, tileSize);
      }
    }
  }
}

Promise.all([
  new Promise(r => rockTexture.onload = r),
  new Promise(r => tree1.onload = r),
  new Promise(r => tree2.onload = r),
  new Promise(r => grassPalette.onload = r)
]).then(() => {
  grassPaletteCanvas.width = grassPalette.width;
  grassPaletteCanvas.height = grassPalette.height;
  grassPaletteCtx.drawImage(grassPalette, 0, 0);

  p = new World();

  // p.waterLevel = Math.random();
  // p.temperature = Math.random();

  p.waterLevel = 0.22;
  p.temperature = 0.5;

  document.getElementById("waterLevel").value = p.waterLevel;
  document.getElementById("temperature").value = p.temperature;

  p.allGrass();
  p.allTrees();

  let liveTiles = [];
  for (let i = 0; i < p.allTiles.length; i++) {
    for (let j = 0; j < p.allTiles[i].length; j++) {
      let tile = p.allTiles[i][j];
      if (tile.grass > 0 || tile.tree) liveTiles.push(tile);
    }
  }
  if (liveTiles.length < 200) {
    for (let tile of liveTiles) {
      tile.grass = 0;
      tile.tree = false;
    }
  }
  
  drawTerrain();
  drawWater();
  step();
});