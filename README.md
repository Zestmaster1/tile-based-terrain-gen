# tile-based terrain gen

Simple algorithm that generates terrain with elevation, temperature, moisture, and plant life if local conditions are optimal.

Generates terrain from random elevation noise, with random regional perturbations in elevation, then smoothed.
Grass will spread to nearby tiles if moisture and temperature are optimal.
Frozen tiles are represented in white, and desert tiles are represented in orange. Grass cannot grow on these tiles.

Interaction:
- Use arrow keys to pan
- Adjust water level and temperature via the sliders
- Button that fills every habitable tile with grass
- Refresh page to generate a new random map