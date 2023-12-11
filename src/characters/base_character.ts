import Phaser, { Physics } from "phaser";
import merge from "lodash.merge";
import { HealthBar } from "../ui/healthbar";

export interface IBaseCharacter extends Phaser.Physics.Arcade.Sprite {
  health: number;
  speed: number;
  extraDestroy: Function;
  healthUpdates(value: number): void;
}

const default_options = {
  health: 1000,
  speed: 200,
  width: 32,
  height: 32
}

export class BaseCharacter extends Phaser.Physics.Arcade.Sprite {
  private cursors!: Phaser.Types.Input.Keyboard.CursorKeys;
  private npc: Boolean = true;
  private health: number;
  private maxHealth: number;
  private speed: number;
  private healthBar: HealthBar;

  public extraDestroy: Function;

  constructor(scene: Phaser.Scene, options?: any) {
    options = merge(default_options, options);
    const { health, speed, width, height, extraDestroy } = options;

    const bounds = scene.physics.world.bounds;
    const x = Phaser.Math.Between(bounds.left + width, bounds.right - width);
    const y = Phaser.Math.Between(bounds.top + height, bounds.bottom - height);

    const color = options.color instanceof Phaser.Display.Color ? options.color : Phaser.Display.Color.RandomRGB();
    const colorName = `rectangle-${color.color32}`;

    const graphics = scene.add.graphics();
    graphics.fillStyle(color.color, 1);
    graphics.fillRect(0, 0, 32, 32);
    graphics.generateTexture(colorName, 32, 32);
    graphics.destroy();

    super(scene, x, y, colorName);
    // this.setStrokeStyle(2, color.color);
    scene.add.existing(this);
    scene.physics.add.existing(this);
    
    if (!scene.input || !scene.input.keyboard) {
      throw new Error("No keyboard input detected");
    }

    const body = this.body as Phaser.Physics.Arcade.Body;
    if (this.body instanceof Phaser.Physics.Arcade.Body) {
      body.setCollideWorldBounds(true);
      body.setBounce(0);
    }

    this.health = health;
    this.maxHealth = health;
    this.speed = speed;

    this.setData("health",this.health);
    this.setData("maxHealth", this.maxHealth);

    this.extraDestroy = extraDestroy;

    this.healthBar = new HealthBar(scene, this);
  }

  healthUpdates(value: number) {
    this.health -= value;
    this.setData("health", this.health);
    console.log("reducing health by", value);

    if (this.health <= 0) {
      this.destroy(false);
    }
  }

  destroy(fromScene?: boolean) {
    // Remove the game object from the npcGroup
    this.extraDestroy && this.extraDestroy(this);
    this.healthBar.destroy();
  
    super.destroy(fromScene);
  }

  update() {
    const speed = this.speed;
    const body = this.body as Phaser.Physics.Arcade.Body;
  
    // Get a reference to the player object
    const player = this && this.scene && this.scene.children.getByName("player") as Phaser.GameObjects.Rectangle;

    if (player) {
      // Calculate the distance between the NPC and the player
      const distance = Phaser.Math.Distance.Between(this.x, this.y, player.x, player.y);

      if (distance > 60) {
        // Calculate the direction vector from the NPC to the player
        const direction = new Phaser.Math.Vector2(player.x - this.x - player.width, player.y - this.y - player.width).normalize();
  
        // Set the velocity of the NPC's physics body to move in the direction of the player
        body.setVelocity(direction.x * speed, direction.y * speed);
      } else {
        // Stop the NPC's physics body if they are too close to the player
        body.setVelocity(0, 0);
      }

      this.healthBar.update();
    }
  }
}