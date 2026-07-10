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

world.addEventListener("click", (e) => {
  const rect = world.getBoundingClientRect();
  const mouseX = e.clientX - rect.left;
  const mouseY = e.clientY - rect.top;

  click(mouseX, mouseY);
});

const rockTexture = new Image();
rockTexture.src = "textures/rock.png";

const tree1 = new Image();
tree1.src = "textures/tree.png";

const tree2 = new Image();
tree2.src = "textures/tree2.png";

const treeTextures = [tree1, tree2];

let tileSize = 20;
let grassMoisture = [0.6, 1];
let treeMoisture = [0.7, 0.9];

let grassMin = Math.min(...grassMoisture);
let grassMax = Math.max(...grassMoisture);
let treeMin = Math.min(...treeMoisture);
let treeMax = Math.max(...treeMoisture);

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
    this.tree = false
    this.treeOffset = {
                        x: this.x + tileSize / 2 + (Math.random() - 0.5) * 10,
                        y: this.y + tileSize / 2 + (Math.random() - 0.5) * 10
                      };
    this.treeTex = Math.round(Math.random());
    this.ore = 0;
    this.state = "fertile";
  }
}

class Planet {
  constructor() {
    this.allTiles = [];
    this.waterLevel = Number(document.getElementById("waterLevel").value);
    this.temperature = Number(document.getElementById("temperature").value);

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
            tile.tree &&
            target.state === "fertile" &&
            !target.tree &&
            tile.moisture > treeMin &&
            tile.moisture < treeMax &&
            Math.random() < 0.025
          ) {
            tile.tree = true;
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
              if (
                !n.tree &&
                n.state === "fertile" &&
                n.moisture > treeMin &&
                n.moisture < treeMax &&
                Math.random() < 0.1
              ) {
                nextTrees[n.gridX][n.gridY] = true;
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

        if (tile.moisture < Math.min(...grassMoisture)) tile.grass = 0;
        if (tile.moisture > Math.max(...grassMoisture)) tile.grass = 0;
        if (tile.moisture < Math.min(...treeMoisture)) tile.tree = false;
        if (tile.moisture > Math.max(...treeMoisture)) tile.tree = false;
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
        tile.tree = true;
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

function step() {
  requestAnimationFrame(step);

  p.step();

  draw();
}

function draw() {
  ctx.clearRect(0, 0, world.width, world.height);

  for (let row of p.allTiles) {
    for (let ind of row) {
      ctx.fillStyle = `rgba(70, 255, 20, ${ind.grass / 4})`;
      if (ind.grass) ctx.fillRect(ind.x, ind.y, tileSize, tileSize);
    }
  }

  // ctx.fillStyle = `rgba(25, 50, 10, 0.1)`;
  ctx.globalAlpha = 0.75;
  ctx.beginPath();
  for (let row of p.allTiles) {
    for (let ind of row) {
      if (ind.tree) {
        let x = ind.treeOffset.x;
        let y = ind.treeOffset.y;
        // ctx.moveTo(x, y);
        // ctx.arc(x, y, 5, 0, Math.PI * 2);
        // ctx.fillRect(x - 4, y - 4, 8, 8);

        ctx.drawImage(treeTextures[ind.treeTex], x - 8, y - 8, 16, 16);
      }
    }
  }
  ctx.globalAlpha = 1;
  // ctx.fill();
}

function drawTerrain() {
  terCtx.clearRect(0, 0, world.width, world.height);
  terCtx.fillStyle = "black";
  terCtx.fillRect(0, 0, terrainCanvas.width, terrainCanvas.height);
  terCtx.globalAlpha = 0.2;
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
          waterCtx.fillStyle = `rgb(50, ${Math.min(1, ind.elevation * 2) * 50 + 100}, ${Math.min(1, ind.elevation * 3) * 100 + 155})`;
        } else {
          waterCtx.fillStyle = `rgb(0, 20, ${Math.min(1, ind.elevation * 3) * 125 + 120})`;
        }
        waterCtx.fillRect(ind.x, ind.y, tileSize, tileSize);
      }
    }
  }
}

Promise.all([
  new Promise(r => rockTexture.onload = r),
  new Promise(r => tree1.onload = r),
  new Promise(r => tree2.onload = r)
]).then(() => {
  p = new Planet();

  p.waterLevel = Math.random();
  p.temperature = Math.random();

  document.getElementById("waterLevel").value = p.waterLevel;
  document.getElementById("temperature").value = p.temperature;

  p.allGrass();
  p.allTrees();
  
  drawTerrain();
  // drawOre();
  drawWater();
  step();
});
