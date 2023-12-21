import Phaser from 'phaser';
import BaseScene from '../generic_scene';

export default class TrainingGroundScene extends BaseScene {
  constructor() {
    super("TrainingGroundScene");
  }

  preload() {
    super.preload({
      preload: [
        "TsGrass",
      ]
    });
  }

  loadMap() {
    console.log("loading map");

    const tileSize = 32;
    this.mapWidth = 200;
    this.mapHeight = 200;

    this.map = this.make.tilemap({ width: this.mapWidth, height: this.mapHeight }) as Phaser.Tilemaps.Tilemap;

    const tileset = this.map.addTilesetImage("TilesetGrass", "TsGrass");

    if (tileset) {
      this.groundLayer = this.map.createBlankLayer('layer', tileset);
    }

    if (this.groundLayer) {
      console.log(this.groundLayer)
      
      // Generate the tilemap procedurally
      for (let row = 0; row < this.mapHeight; row++) {
        for (let col = 0; col < this.mapWidth; col++) {
          const tileIndex = Math.floor(Math.random() * 30); // Randomly choose tile index (0 or 1)
          this.groundLayer.putTileAt(tileIndex, col, row);
        }
      }

      this.groundLayer.setDepth(0);
    } else {
      throw new Error("No layer exists for procedural generation");
    }
  }
}