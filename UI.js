world.addEventListener("click", (e) => {
  const rect = world.getBoundingClientRect();

  const mouseX = e.clientX - rect.left;
  const mouseY = e.clientY - rect.top;

  // click(mouseX, mouseY);
});

const keys = {};

window.addEventListener("keydown", e => {
  keys[e.key] = true;
});

window.addEventListener("keyup", e => {
  keys[e.key] = false;
});

function userInput() {
  waterLevel = Number(document.getElementById("waterLevel").value);
  temperature = Number(document.getElementById("temperature").value);
  p.updateTiles();
}

function refreshGrass() {
  for (let i = 0; i < p.tiles.length; i++) {
    for (let j = 0; j < p.tiles[i].length; j++) {
      p.tiles[i][j].grass = 1;
      p.updateTiles();
    }
  }
}