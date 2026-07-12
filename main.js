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

const oreCanvas = document.getElementById("ore");
const oreCtx = oreCanvas.getContext("2d");
oreCanvas.width = world.width;
oreCanvas.height = world.height;

const grassPaletteCanvas = document.createElement("canvas");
const grassPaletteCtx = grassPaletteCanvas.getContext("2d");

world.addEventListener("click", (e) => {
    const rect = world.getBoundingClientRect();

    const mouseX = e.clientX - rect.left;
    const mouseY = e.clientY - rect.top;

    let worldX = (mouseX + camera.x) % world.width;
    let worldY = (mouseY + camera.y) % world.height;

    if (worldX < 0) worldX += world.width;
    if (worldY < 0) worldY += world.height;

    click(worldX, worldY);
});

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

class Tile {
  constructor(x, y) {
    this.x = x;
    this.y = y;
    this.gridX = Math.floor(x / tileSize);
    this.gridY = Math.floor(y / tileSize);
    this.neighbors = [];
    this.elevation = Math.random();
    this.moisture = 0;
    this.grass = 0;
    this.tree = false;
    this.treeOffset = {
                        x: this.x + tileSize / 2 + (Math.random() - 0.5) * 10,
                        y: this.y + tileSize / 2 + (Math.random() - 0.5) * 10
                      };
    this.treeTex = Math.round(Math.random());
    this.cactusTex = Math.round(Math.random());
    this.ore = 0;
    this.state = "fertile";
  }
}

class Planet {
  constructor() {
    this.allTiles = [];
    this.waterLevel = Number(document.getElementById("waterLevel").value);
    this.temperature = Number(document.getElementById("temperature").value);

    this.grassColor = randomPaletteColor();

    this.tick = 0;

    this.initialize();
  }

  initialize() {
    for (let i = 0; i < world.width / tileSize; i++) this.allTiles.push([]);

    // create tiles and tile positions
    for (let i = 0; i < world.width / tileSize; i++) {
      for (let j = 0; j < world.height / tileSize; j++) {
        let newTile = new Tile(i * tileSize, j * tileSize);
        this.allTiles[i].push(newTile);
      }
    }

    // compile neighbors for each tile
    for (let i = 0; i < this.allTiles.length; i++) {
      for (let j = 0; j < this.allTiles[i].length; j++) {
        let tile = this.allTiles[i][j];

        const w = this.allTiles.length;
        const h = this.allTiles[0].length;

        let neighbors = [
          this.allTiles[(i + 1) % w][j],
          this.allTiles[(i - 1 + w) % w][j],
          this.allTiles[i][(j + 1) % h],
          this.allTiles[i][(j - 1 + h) % h]
        ]

        tile.neighbors = neighbors;
      }
    }

    this.generateLandmarks();
    this.generateOre();
    for (let i = 0; i < 7; i++) this.smooth();

    this.refreshTiles();
  }

  step() {
    this.tick++;

    // tick 200
    if (this.tick % 200 === 0) {
      // random spore event
      for (let i = 0; i < this.allTiles.length; i++) {
        for (let j = 0; j < this.allTiles[i].length; j++) {

          let tile = this.allTiles[i][j];

          let target = tile;

          while (target === tile) {
            let row = Math.floor(Math.random() * this.allTiles.length);
            let col = Math.floor(Math.random() * this.allTiles[row].length);
            target = this.allTiles[row][col];
          }

          if (
            tile.grass === 1 &&
            target.state === "fertile" &&
            target.grass === 0 &&
            target.moisture > grassMin &&
            target.moisture < grassMax &&
            Math.random() < 0.05
          ) {
            target.grass = 0.1
          }

          if (
            tile.tree === "tree" &&
            target.state === "fertile" &&
            !target.tree &&
            target.moisture > treeMin &&
            target.moisture < treeMax &&
            Math.random() < 0.025
          ) {
            tile.tree = "tree";
          }

          if (
            tile.tree === "cactus" &&
            target.state === "fertile" &&
            !target.tree &&
            target.moisture > cactusMin &&
            target.moisture < cactusMax &&
            Math.random() < 0.05
          ) {
            tile.tree = "cactus";
          }
        }
      }

      p.refreshTiles();
    }

    // tick 20
    if (this.tick % 20 === 0) {
      // grass & tree spread
      let nextGrass = [];
      let nextTrees = [];

      for (let i = 0; i < this.allTiles.length; i++) {
        nextGrass[i] = [];
        nextTrees[i] = [];

        for (let j = 0; j < this.allTiles[i].length; j++) {
          nextGrass[i][j] = this.allTiles[i][j].grass;
          nextTrees[i][j] = this.allTiles[i][j].tree;
        }
      }

      for (let i = 0; i < this.allTiles.length; i++) {
        for (let j = 0; j < this.allTiles[i].length; j++) {
          let tile = this.allTiles[i][j];

          if (tile.grass > 0) {
            for (let n of tile.neighbors) {
              if (
                n.grass < 1 &&
                n.state === "fertile" &&
                n.moisture > grassMin &&
                n.moisture < grassMax &&
                Math.random() < 0.25
              ) {
                nextGrass[n.gridX][n.gridY] = Math.min(nextGrass[n.gridX][n.gridY] + 0.2, 1);
              }
            }
          }

          if (tile.tree) {
            for (let n of tile.neighbors) {
              if (tile.tree === "tree") {
                if (
                  !n.tree &&
                  n.state === "fertile" &&
                  n.moisture > treeMin &&
                  n.moisture < treeMax &&
                  Math.random() < 0.1
                ) {
                  nextTrees[n.gridX][n.gridY] = "tree";
                }
              } else if (tile.tree === "cactus") {
                if (
                  !n.tree &&
                  n.state === "fertile" &&
                  n.moisture > cactusMin &&
                  n.moisture < cactusMax &&
                  Math.random() < 0.1
                ) {
                  nextTrees[n.gridX][n.gridY] = "cactus";
                }
              }
            }
          }
        }
      }

      for (let i = 0; i < this.allTiles.length; i++) {
        for (let j = 0; j < this.allTiles[i].length; j++) {
          p.allTiles[i][j].grass = nextGrass[i][j];
          p.allTiles[i][j].tree = nextTrees[i][j];
        }
      }
    }
  }

  refreshTiles() {
    for (let i = 0; i < this.allTiles.length; i++) {
      for (let j = 0; j < this.allTiles[i].length; j++) {
        let tile = this.allTiles[i][j];
        tile.moisture = Math.min(1, Math.max(0, (1 / tile.elevation) * this.waterLevel));
        if (tile.elevation < this.waterLevel) {
          tile.moisture = 1;
          tile.grass = 0;
        }

        if (this.temperature - tile.elevation > tempCurve) {
          tile.state = "desert";
          tile.grass = 0;
          tile.tree = false;
        } else if (tile.elevation + tempCurve - this.temperature > tempCurve) {
          tile.state = "snow";
          tile.grass = 0;
          tile.tree = false;
        } else {
          tile.state = "fertile";
        }

        if (tile.moisture < grassMin) tile.grass = 0;
        if (tile.moisture > grassMax) tile.grass = 0;
        
        if (tile.tree === "tree") {
          if (tile.moisture < treeMin) tile.tree = false;
          if (tile.moisture > treeMax) tile.tree = false;
        }

        if (tile.tree === "cactus") {
          if (tile.moisture < cactusMin) tile.tree = false;
          if (tile.moisture > cactusMax) tile.tree = false;
        }
      }
    }
  }

  waterLevelChange() {
    this.waterLevel = Number(document.getElementById("waterLevel").value);

    this.refreshTiles();
    drawWater();
  }

  temperatureChange() {
    this.temperature = Number(document.getElementById("temperature").value);

    this.refreshTiles();
    drawTerrain();
    drawWater();
  }

  // give every eligible tile grass
  allGrass() {
    for (let i = 0; i < this.allTiles.length; i++) {
      for (let j = 0; j < this.allTiles[i].length; j++) {
        let tile = this.allTiles[i][j];
        tile.grass = 1;
      }
    }

    this.refreshTiles();
  }

  // give every eligible tile a tree
  allTrees() {
    for (let i = 0; i < this.allTiles.length; i++) {
      for (let j = 0; j < this.allTiles[i].length; j++) {
        let tile = this.allTiles[i][j];
        
        if (tile.moisture > treeMin && tile.moisture < treeMax) tile.tree = "tree";
        if (tile.moisture > cactusMin && tile.moisture < cactusMax) tile.tree = "cactus";
      }
    }

    this.refreshTiles();
  }

  generateLandmarks() {
    const w = world.width;
    const h = world.height;

    for (let n = 0; n < 150; n++) {
      let x = Math.random() * world.width;
      let y = Math.random() * world.height;
      let r = 50 + Math.random() * 100;
      let elevChange = Math.random() - 0.5;

      for (let i = 0; i < this.allTiles.length; i++) {
        for (let j = 0; j < this.allTiles[i].length; j++) {
          let tile = this.allTiles[i][j];

          let dx = Math.abs(tile.x - x);
          dx = Math.min(dx, w - dx);

          let dy = Math.abs(tile.y - y);
          dy = Math.min(dy, h - dy);

          if (dx * dx + dy * dy < r * r) {
            let scale = 0.8;
            let noise = (Math.random() - 0.5) / 5;
            tile.elevation = Math.min(1, Math.max(0, (scale * tile.elevation + (1 - scale) * elevChange) + noise));
          }
        }
      }
    }
  }

  smooth() {
    let scale = 0.8;

    let newElevs = [];
    let newOres = [];

    for (let i = 0; i < this.allTiles.length; i++) {
      newElevs[i] = [];
      newOres[i] = [];
      for (let j = 0; j < this.allTiles[i].length; j++) {
        newElevs[i][j] = this.allTiles[i][j].elevation;
        newOres[i][j] = this.allTiles[i][j].ore;

        let tile = this.allTiles[i][j];

        let sumElevation = 0;
        let sumOre = 0;
        for (let n of tile.neighbors) {
          sumElevation += scale * n.elevation + (1 - scale) * tile.elevation; 
          sumOre += scale * n.ore + (1 - scale) * tile.ore;
        }

        newElevs[i][j] = sumElevation / 4;
        newOres[i][j] = sumOre / 4;
      }
    }

    for (let i = 0; i < this.allTiles.length; i++) {
      for (let j = 0; j < this.allTiles[i].length; j++) {
        this.allTiles[i][j].elevation = newElevs[i][j];
        this.allTiles[i][j].ore = newOres[i][j];
      }
    }
  }

  generateOre() {
    const w = world.width;
    const h = world.height;

    for (let n = 0; n < 20; n++) {
      let x = Math.random() * world.width;
      let y = Math.random() * world.height;
      let r = 50 + Math.random() * 100;
      let oreChange = Math.random();

      for (let i = 0; i < this.allTiles.length; i++) {
        for (let j = 0; j < this.allTiles[i].length; j++) {
          let tile = this.allTiles[i][j];

          let dx = Math.abs(tile.x - x);
          dx = Math.min(dx, w - dx);

          let dy = Math.abs(tile.y - y);
          dy = Math.min(dy, h - dy);

          let distSq = dx * dx + dy * dy;

          if (distSq < r * r) {
            let scale = 0.3;
            let noise = 0 // (Math.random() - 0.5) / 20;
            // tile.ore = Math.min(1, Math.max(0, (scale * tile.ore + scale * oreChange) + noise));

            // let t = 1 - Math.sqrt(distSq) / r;

            // if (t > 0) {
            //     tile.ore += t * t;
            // }

            tile.ore = Math.min(1, tile.ore + r ** 2 / distSq / 10);
          }
        }
      }
    }
  }
}

function click(x, y) {
  let tile = p.allTiles[Math.floor(x / tileSize)][Math.floor(y / tileSize)];

  tile.grass = 0.1;
  tile.tree = true;

  p.refreshTiles();
}

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
  drawWrappedCanvas(ctx, waterCanvas);
  // drawWrappedCanvas(ctx, oreCanvas);

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

function drawOre() {
  oreCtx.clearRect(0, 0, oreCanvas.width, oreCanvas.height);
  for (let row of p.allTiles) {
    for (let ind of row) {

      if (ind.ore) {
        oreCtx.fillStyle = `rgba(255, 200, 50, ${ind.ore})`;
        oreCtx.fillRect(ind.x, ind.y, tileSize, tileSize);
      }
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

  p = new Planet();

  p.waterLevel = Math.random();
  p.temperature = Math.random();

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
  // drawOre();
  drawWater();
  step();
});
