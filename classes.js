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
    this.state = "fertile";
  }
}

class World {
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
            target.tree = "tree";
          }

          if (
            tile.tree === "cactus" &&
            target.state === "fertile" &&
            !target.tree &&
            target.moisture > cactusMin &&
            target.moisture < cactusMax &&
            Math.random() < 0.05
          ) {
            target.tree = "cactus";
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

    for (let i = 0; i < this.allTiles.length; i++) {
      newElevs[i] = [];
      for (let j = 0; j < this.allTiles[i].length; j++) {
        newElevs[i][j] = this.allTiles[i][j].elevation;

        let tile = this.allTiles[i][j];

        let sumElevation = 0;
        for (let n of tile.neighbors) {
          sumElevation += scale * n.elevation + (1 - scale) * tile.elevation; 
        }

        newElevs[i][j] = sumElevation / 4;
      }
    }

    for (let i = 0; i < this.allTiles.length; i++) {
      for (let j = 0; j < this.allTiles[i].length; j++) {
        this.allTiles[i][j].elevation = newElevs[i][j];
      }
    }
  }
}