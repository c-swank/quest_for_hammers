import { Player } from "./";

class PlayerUI extends Phaser.GameObjects.Container {
  private player: Player;
  private healthText: Phaser.GameObjects.Text;
  private scoreText: Phaser.GameObjects.Text;

  constructor(scene: Phaser.Scene, player: Player) {
    super(scene);

    this.player = player;

    // Create and position the health text
    this.healthText = scene.add.text(10, 10, '', { fontSize: '24px' }).setColor('#ffffff');
    this.add(this.healthText);

    // Create and position the score text
    this.scoreText = scene.add.text(10, 40, '', { fontSize: '24px' }).setColor('#ffffff');
    this.add(this.scoreText);

    // Add the container to the scene
    scene.add.existing(this);
  }

  update() {
    // Update the health and score text based on the player's state
    this.healthText.setText(`Health: ${this.player.health}`);
    this.scoreText.setText(`Score: ${this.player.score}`);
  }
}