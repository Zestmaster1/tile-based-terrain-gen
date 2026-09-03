class Tile {
  constructor(x, y) {
    this.x = x ?? 0;
    this.y = y ?? 0;
    this.neighbors = [];

    this.moisture = 0;
    this.elevation = Math.random();

    this.grass = 1;
    this.state;
  }
}

class Terrain {
  constructor(tiles = []) {
    this.tiles = tiles;

    this.initialize();
  }

  initialize() {
    for (let i = 0; i < world.width / tileSize; i++) this.tiles.push([]);

    // create tiles and tile positions
    for (let i = 0; i < world.width / tileSize; i++) {
      for (let j = 0; j < world.height / tileSize; j++) {
        let newTile = new Tile(i * tileSize, j * tileSize);
        this.tiles[i].push(newTile);
      }
    }

    // compile neighbors for each tile
    for (let i = 0; i < this.tiles.length; i++) {
      for (let j = 0; j < this.tiles[i].length; j++) {
        let tile = this.tiles[i][j];

        const w = this.tiles.length;
        const h = this.tiles[0].length;

        let neighbors = [
          this.tiles[(i + 1) % w][j],
          this.tiles[(i - 1 + w) % w][j],
          this.tiles[i][(j + 1) % h],
          this.tiles[i][(j - 1 + h) % h]
        ];

        tile.neighbors = neighbors;
      }
    }

    this.generateLandmarks();
    this.amplify();
    for (let i = 0; i < 5; i++) this.smooth();
    this.updateTiles();
  }

  generateLandmarks() {
    for (let n = 0; n < numLandmarks; n++) {
      let x = Math.random() * worldWidth;
      let y = Math.random() * worldHeight;
      let r = minLandmarkRadius + Math.random() * 100;
      let elevChange = Math.random() - 0.25;

      for (let i = 0; i < this.tiles.length; i++) {
        for (let j = 0; j < this.tiles[i].length; j++) {
          let ind = this.tiles[i][j];

          let dx = Math.abs(ind.x - x);
          dx = Math.min(dx, worldWidth - dx);

          let dy = Math.abs(ind.y - y);
          dy = Math.min(dy, worldHeight - dy);

          if (dx * dx + dy * dy < r * r) {
            let noise = (Math.random() - 0.5) * 0.3;
            ind.elevation =
              Math.min(1,
              Math.max(0,
                (landmarkBlendScale * ind.elevation + (1 - landmarkBlendScale) * elevChange)
                + noise));
          }
        }
      }
    }
  }

  smooth() {
    let newElevs = [];

    for (let i = 0; i < this.tiles.length; i++) {
      newElevs[i] = [];

      for (let j = 0; j < this.tiles[i].length; j++) {
        newElevs[i][j] = this.tiles[i][j].elevation;

        let ind = this.tiles[i][j];

        let sumElevation = 0;

        for (let n of ind.neighbors) {
          sumElevation += n.elevation;
        }

        newElevs[i][j] =
        smoothingScale * (sumElevation / 4) +
        (1 - smoothingScale) * ind.elevation;
      }
    }

    for (let i = 0; i < this.tiles.length; i++) {
      for (let j = 0; j < this.tiles[i].length; j++) {
        this.tiles[i][j].elevation = newElevs[i][j];
      }
    }
  }

  amplify() {
    for (let i = 0; i < this.tiles.length; i++) {
      for (let j = 0; j < this.tiles[i].length; j++) {
        let ind = this.tiles[i][j];

        let diff = ind.elevation - 0.5;

        ind.elevation = Math.max(
          0,
          Math.min(
            1,
            ind.elevation + diff / amplificationScale
        ));
      }
    }
  }

  updateTiles() {
    for (let i = 0; i < this.tiles.length; i++) {
      for (let j = 0; j < this.tiles[i].length; j++) {
        let ind = this.tiles[i][j];

        ind.state = null;

        if (ind.elevation <= waterLevel) {
          ind.moisture = 1;
        } else {
          ind.moisture = Math.min(1, Math.max(0, (1 / ind.elevation) * waterLevel));
        }

        let localTemperature = temperature - ind.elevation / 2;
        localTemperature = Math.max(0, Math.min(1, localTemperature));

        if (localTemperature < coldPoint) {
          ind.state = "cold";
        } else if (localTemperature > hotPoint) {
          ind.state = "hot";
        }

        if (
          ind.moisture === 1 ||
          ind.state ||
          ind.moisture < minGrassMoisture ||
          ind.moisture > maxGrassMoisture
          
        ) ind.grass = 0;
      }
    }
  }
}