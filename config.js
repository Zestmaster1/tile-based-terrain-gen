let worldWidth = 1000;
let worldHeight = 500;

let tileSize = 10;

let waterLevel = 0.2;
let temperature = 0.5;

let grassMoisture = [0.55, 1];
let minGrassMoisture = Math.min(...grassMoisture);
let maxGrassMoisture = Math.max(...grassMoisture);

let hotPoint = 0.45;
let coldPoint = 0.30;

let smoothingScale = 0.75;
let amplificationScale = 2;
let numLandmarks = 150;
let minLandmarkRadius = 50;
let landmarkBlendScale = 0.8;