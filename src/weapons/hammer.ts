import { Player } from "../characters/player";

export default class Weapon extends Phaser.Physics.Arcade.Sprite {
  private player: Player;

  constructor(scene: Phaser.Scene, player: Player) {
    const graphics = scene.add.graphics();
    graphics.fillStyle(0xff0000, 1);
    graphics.fillRect(0, 0, 32, 32);
    graphics.generateTexture("read-weapon", 32, 32);
    graphics.destroy();
    super(scene, player.x, player.y, "read-weapon");

    // Add weapon sprite to scene
    scene.add.existing(this);
    scene.physics.add.existing(this);

    // Set weapon properties
    this.setCollideWorldBounds(true);
    this.setBounce(0.2);
    this.setDisplaySize(10, 20); // Set the display size of the rectangle

    // Store player property
    this.player = player;

    // Add overlap collider between weapon and NPCs
    // const npcsGroup = scene.physics.world.getGroupByName("NPCs") as Phaser.Physics.Arcade.Group;
    // scene.physics.add.overlap(this, npcsGroup, this.onOverlap, null, this);
  }

  update() {
    // Update weapon position
    // const offsetX = this.player.facingLeft ? -5 : 5;
    const offsetX = 20;
    this.setPosition(this.player.x + offsetX, this.player.y);

    // Handle weapon input
    // if (Phaser.Input.Keyboard.JustDown(this.scene.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.K))) {
    //   const velocity = this.player.facingLeft ? -500 : 500;
    //   this.setActive(true);
    //   this.setVisible(true);
    //   this.setVelocityX(velocity);
    // }
  }

  onOverlap(weapon: Phaser.Physics.Arcade.Sprite, npc: Phaser.Physics.Arcade.Sprite) {
    // Handle weapon-NPC collision
    // npc.health -= 10;
    weapon.setActive(false);
    weapon.setVisible(false);
  }
}