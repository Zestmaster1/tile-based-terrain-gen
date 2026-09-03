let p = new Terrain();

function step() {
  if (keys["ArrowRight"]) {
    let temp = p.tiles.shift();
    p.tiles.push(temp);

    for (let i = 0; i < p.tiles.length; i++) {
      for (let j = 0; j < p.tiles[i].length; j++) {
        p.tiles[i][j].x = i * tileSize;
      }
    }

    drawBackground();
  }

  if (keys["ArrowLeft"]) {
    let temp = p.tiles.pop();
    p.tiles.unshift(temp);

    for (let i = 0; i < p.tiles.length; i++) {
      for (let j = 0; j < p.tiles[i].length; j++) {
        p.tiles[i][j].x = i * tileSize;
      }
    }

    drawBackground();
  }

  if (keys["ArrowDown"]) {
    for (let i = 0; i < p.tiles.length; i++) {
      let temp = p.tiles[i].shift();
      p.tiles[i].push(temp);
    }

    for (let i = 0; i < p.tiles.length; i++) {
      for (let j = 0; j < p.tiles[i].length; j++) {
        p.tiles[i][j].y = j * tileSize;
      }
    }

    drawBackground();
  }

  if (keys["ArrowUp"]) {
    for (let i = 0; i < p.tiles.length; i++) {
      let temp = p.tiles[i].pop();
      p.tiles[i].unshift(temp);
    }

    for (let i = 0; i < p.tiles.length; i++) {
      for (let j = 0; j < p.tiles[i].length; j++) {
        p.tiles[i][j].y = j * tileSize;
      }
    }

    drawBackground();
  }

  // update loop
  for (let i = 0; i < p.tiles.length; i++) {
    for (let j = 0; j < p.tiles[i].length; j++) {
      let ind = p.tiles[i][j];

      if (ind.grass) {
        if (ind.grass > 0.25 && Math.random() < 10.25) {
          let n = ind.neighbors[Math.floor(Math.random() * 4)];
          if (
            !n.grass &&
            n.moisture < 1 &&
            !n.state &&
            n.moisture > minGrassMoisture &&
            n.moisture < maxGrassMoisture
          ) {
            n.grass = 0.1;
          }
        }
        if (ind.grass < 1) ind.grass = Math.min(1, ind.grass + 0.05);
      }
    }
  }

  drawSurface();
  drawBackground(); 
  requestAnimationFrame(step);
}

step();