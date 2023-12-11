import * as Phaser from "phaser";

export class HealthBar extends Phaser.GameObjects.Graphics {
  private character: Phaser.GameObjects.Sprite;
  private width: number;
  private height: number;

  constructor(scene: Phaser.Scene, npc: Phaser.GameObjects.Sprite) {
    super(scene);

    this.character = npc;
    this.setDepth(1);
    this.x = npc.x;
    this.y = npc.y - 20;
    this.width = npc.width;
    this.height = 5;
    this.updateHealthBar();
    scene.add.existing(this);
  }

  update() {
    this.x = this.character.x - 16;
    this.y = this.character.y - 20;
    this.updateHealthBar();
    // console.log("updating healthbar");
  }

  private updateHealthBar() {
    // Draw the health bar background
    // console.log(this.character.getData("health"));
    this.clear();
    this.fillStyle(0x000000, 0.5);
    this.fillRect(0, 0, this.width, 5);
  
    // Draw the health bar
    const healthRatio = this.character.getData("health") / this.character.getData("maxHealth");
    const healthWidth = this.width * healthRatio;
    this.fillStyle(this.getGradientColor());
    this.fillRect(0, 0, healthWidth, 5);
  }
  
  private getGradientColor() {
    const healthRatio = this.character.getData("health") / this.character.getData("maxHealth");
    if (healthRatio > 0.5) {
      return Phaser.Display.Color.GetColor(0, 255, 0);
    } else if (healthRatio > 0.2) {
      return Phaser.Display.Color.GetColor(255, 255, 0);
    } else {
      return Phaser.Display.Color.GetColor(255, 0, 0);
    }
  }
}