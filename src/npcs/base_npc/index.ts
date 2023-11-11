import Phaser, { Physics } from "phaser";
import merge from "lodash.merge";
import { HealthBar } from "../../ui/healthbar";

export interface IBaseNpc extends Phaser.Physics.Arcade.Sprite {
  npc: Boolean;
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

export class BaseNpc extends Phaser.Physics.Arcade.Sprite {
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

    // Define a callback function to filter out other NPC's and the player
    // const npcCollisionFilter = (npc: Phaser.GameObjects.GameObject, other: Phaser.GameObjects.GameObject) => {
    //   return other instanceof Phaser.GameObjects;
    // };

    // // Set the NPC's body to not collide with other NPC's or with the player
    // const npcCollider = scene.physics.add.collider(this, other, npcCollisionFilter);

    // npcCollider.collideCallback = (npc: Phaser.GameObjects.GameObject, other: Phaser.GameObjects.GameObject) => {
    //   // Stop the NPC's physics body if they collide with another NPC or with the player
    //   const body = npc.body as Phaser.Physics.Arcade.Body;
    //   body.setVelocity(0, 0);
    // };
  }

  healthUpdates(value: number) {
    this.health -= value;
    this.setData("health", this.health);
    console.log("reducing health by", value);

    if (this.health <= 0) {
      // const colliders = this.scene.physics.world.colliders.getActive();
      // // colliders.find((collider: Physics.Arcade.Collider) => collider.object1 === this.body || collider.bodyB === this.body)?.destroy();
      // for (const collider of colliders) {
      //   if (collider.object1 === this.body || collider.object2 === this.body) {
      //     collider.destroy();
      //   }
      // }
      // console.log(colliders);
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

      // this.healthUpdates(1);
    }

    // Prevent jittering and clipping effect when the player collides with the world boundary
    // if (body && (body.blocked.left || body.blocked.right || body.blocked.up || body.blocked.down)) {
    //   const overlapLeft = Math.abs(body.left - this.scene.physics.world.bounds.left);
    //   const overlapRight = Math.abs(body.right - this.scene.physics.world.bounds.right);
    //   const overlapUp = Math.abs(body.top - this.scene.physics.world.bounds.top);
    //   const overlapDown = Math.abs(body.bottom - this.scene.physics.world.bounds.bottom);

    //   if (overlapLeft < overlapRight && overlapLeft < overlapUp && overlapLeft < overlapDown) {
    //     this.x += overlapLeft;
    //   } else if (overlapRight < overlapLeft && overlapRight < overlapUp && overlapRight < overlapDown) {
    //     this.x -= overlapRight;
    //   } else if (overlapUp < overlapLeft && overlapUp < overlapRight && overlapUp < overlapDown) {
    //     this.y += overlapUp;
    //   } else if (overlapDown < overlapLeft && overlapDown < overlapRight && overlapDown < overlapUp) {
    //     this.y -= overlapDown;
    //   }
    // }

    // if (this.cursors.left.isDown) {
    //   this.x -= speed * this.scene.game.loop.delta / 1000;
    // } else if (this.cursors.right.isDown) {
    //   this.x += speed * this.scene.game.loop.delta / 1000;
    // }

    // if (this.cursors.up.isDown) {
    //   this.y -= speed * this.scene.game.loop.delta / 1000;
    // } else if (this.cursors.down.isDown) {
    //   this.y += speed * this.scene.game.loop.delta / 1000;
    // }
  }
}