import Phaser, { Physics } from "phaser";
import merge from "lodash.merge";
import { HealthBar } from "../../../ui/healthbar";
import eventManager from "../../../gamestate/events";
import { Player } from "../../player";

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
  private wanderTarget?: Phaser.Math.Vector2;
  private wanderRadius: number = 400;
  private _isWandering = false;
  private startPosition: Phaser.Math.Vector2;
  private detectionRadius: number = 200;
  private tooltip: Phaser.GameObjects.Text | null;

  public extraDestroy: Function;
  // private eventEmitter: EventEmitter;

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
    // this.startPosition = [this.x,this.y];
    this.startPosition = new Phaser.Math.Vector2(x, y);
    
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

    this.tooltip = null;

    this.setInteractive();
    // this.on('pointerover', this.showTooltip, this);
    // this.on('pointerout', this.hideTooltip, this);
    this.showTooltip();

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

  private setToolTipText() {
    this.tooltip?.setText(`NPC Information ${JSON.stringify(this, null, 2)}`);
  }

  private showTooltip() {
    // Create and position the tooltip
    this.tooltip = this.scene.add.text(10, 200, `NPC Information ${JSON.stringify(this, null, 2)}`, { fontSize: '16px', color: '#ffffff', wordWrap: {width: 300, useAdvancedWrap: true }});
    // this.tooltip.setOrigin(0.5);
  }

  private hideTooltip() {
    // Remove or hide the tooltip
    this.tooltip?.destroy();
    this.tooltip = null;
  }

  healthUpdates(value: number) {
    this.health -= value;
    this.setData("health", this.health);
    console.log("reducing health by", value);

    eventManager.emit('npc:damaged', value);

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

    console.log("emitting event");
    eventManager.emit('npc:destroyed', this);
  
    super.destroy(fromScene);
  }

  set isWandering(bool: boolean) {
    console.log('setting isWandering', this._isWandering);
    this._isWandering = bool;
  }

  get isWandering(): boolean {
    // console.log('isWandering', this._isWandering);
    return this._isWandering;
  }

  getOrSetWanderTarget = (): Phaser.Math.Vector2 => {
    if (!this.scene) {
      return new Phaser.Math.Vector2(0,0);
    }

    const sceneBounds = this.scene.physics.world.bounds;

    const setTargetToStart = () => {
      this.wanderTarget = this.startPosition;
      this.isWandering = false;
    };

    const setNewWanderTarget = () => {
      this.isWandering = true;
      const randomAngle = Math.random() * Math.PI * 2;
      const randomRadius = Math.random() * this.wanderRadius;
       // this.wanderTarget.x = Math.floor(Phaser.Math.Clamp(this.wanderTarget.x, sceneBounds.left + 10, sceneBounds.right - 10));
    // this.wanderTarget.y = Math.floor(Phaser.Math.Clamp(this.wanderTarget.y, sceneBounds.top + 10, sceneBounds.bottom - 10));
      const targetX = Phaser.Math.Clamp(this.startPosition.x + Math.cos(randomAngle) * randomRadius, sceneBounds.left + this.width + 10, sceneBounds.right - this.width - 10);
      const targetY = Phaser.Math.Clamp(this.startPosition.y + Math.sin(randomAngle) * randomRadius, sceneBounds.top + this.height + 10, sceneBounds.bottom - this.height - 10);
      this.wanderTarget = new Phaser.Math.Vector2(targetX, targetY);
      console.log('wanderTarget is', this.wanderTarget)
      console.log('sceneBounds are', sceneBounds)
    };

    if (!this.wanderTarget) {
      console.log('setting wander to start')
      setTargetToStart();
    }

    if (this.isWandering && Phaser.Math.Distance.Between(this.x, this.y, this.wanderTarget!.x, this.wanderTarget!.y) < 5) {
      console.log('reached destination, returning to start position');
      setTargetToStart();
    }

    if (!this.isWandering && Phaser.Math.Distance.Between(this.x, this.y, this.startPosition.x, this.startPosition.y) < 5) {
      console.log('picking new wander target');
      setNewWanderTarget();
    }

    return this.wanderTarget as Phaser.Math.Vector2;

    // const [ startX, startY ] = this.startPosition;

    // const sceneBounds = this.scene.physics.world.bounds;
    // const currentX = Math.floor(Phaser.Math.Between(sceneBounds.left + this.width, sceneBounds.right - this.width));
    // const currentY = Math.floor(Phaser.Math.Between(sceneBounds.top + this.height, sceneBounds.bottom - this.height));

    // // Initialize to start if undefined
    // const setWanderToStart = () => {
    //   console.log('setting wander to start')
    //   this.wanderTarget!.set(startX, startY);
    //   this.wanderTarget!.normalize();
    //   this.wanderTarget!.scale(this.wanderRadius);
    // };

    // if (!this.wanderTarget) {
    //   this.wanderTarget = new Phaser.Math.Vector2();
    //   setWanderToStart();
    // }

    // console.log('some relevant information', {
    //   currentX,
    //   currentY,
    //   startX,
    //   startY,
    //   targetX: this.wanderTarget.x,
    //   targetY: this.wanderTarget.y
    // });

    // // Return to start position if we have reached out current Wander Target
    // const shouldReturnToStart = currentX === this.wanderTarget.x && currentY === this.wanderTarget.y;
    // if (shouldReturnToStart) {
    //   setWanderToStart();
    // } else if (currentX === startX && currentY === startY) {
    //   // Get a new wander target
    //   console.log('setting wander to new target')
    //   const [x,y] = [Math.random() * 2 - 1, Math.random() * 2 - 1];
    //   console.log('X and Y random values are', {x,y});
    //   this.wanderTarget.set(x,y);
    //   this.wanderTarget.normalize();
    //   this.wanderTarget.scale(this.wanderRadius);
    //   console.log('X and Y values after scaling are', {x: this.wanderTarget.x, y: this.wanderTarget.y})
    // }

    // // Clamp the wander target position within the scene bounds
    // this.wanderTarget.x = Math.floor(Phaser.Math.Clamp(this.wanderTarget.x, sceneBounds.left + 10, sceneBounds.right - 10));
    // this.wanderTarget.y = Math.floor(Phaser.Math.Clamp(this.wanderTarget.y, sceneBounds.top + 10, sceneBounds.bottom - 10));
    // console.log('X and Y values after clamping are', {x: this.wanderTarget.x, y: this.wanderTarget.y})

    // // By default, return the current target if we are neither at start or destination
    // // this.wanderTarget.add(new Phaser.Math.Vector2(this.x, this.y));
    // console.log({
    //   target: this.wanderTarget,
    //   sceneBounds
    // })
    // return this.wanderTarget;
  };

  update() {
    const speed = this.speed;
    const body = this.body as Phaser.Physics.Arcade.Body;

    if (!this.body) {
      return;
    }

    const wanderTarget = this.getOrSetWanderTarget();
    const direction = wanderTarget.clone().subtract(new Phaser.Math.Vector2(this.x, this.y)).normalize();
    const velocity = direction.scale(this.speed);
    // this.x += velocity.x;
    // this.y += velocity.y;
    body.setVelocity(velocity.x, velocity.y)
  
    // Get a reference to the player object
    // const player = this && this.scene && this.scene.children.getByName("player") as Player;

    // const wonder1 = () => {
    //   // Apply wander behavior for random movement
    //   const wanderRadius = 50; // Adjust the radius as needed
    //   const wanderDistance = 100; // Adjust the distance as needed
    //   const wanderJitter = 0.01; // Adjust the jitter as needed
  
    //   // Calculate the wander target position
    //   // const wanderTarget = new Phaser.Math.Vector2();
    //   // wanderTarget.set(Math.random() * 2 - 1, Math.random() * 2 - 1);
    //   // wanderTarget.normalize();
    //   // wanderTarget.scale(wanderRadius);
    //   // wanderTarget.add(new Phaser.Math.Vector2(this.x, this.y));
    //   const wanderTarget = this.getOrSetWanderTarget();

    //   if (!wanderTarget) {
    //     body.setVelocity(0, 0);
    //     return;
    //   }

    //   // Calculate the displacement force
    //   // const displacement = new Phaser.Math.Vector2();
    //   // displacement.set(Math.random() * 2 - 1, Math.random() * 2 - 1);
    //   // displacement.normalize();
    //   // displacement.scale(wanderJitter);
    //   // wanderTarget.add(displacement);

    //   // Calculate the direction vector towards the wander target
    //   const wanderDirection = new Phaser.Math.Vector2();
    //   wanderDirection.set(wanderTarget.x, wanderTarget.y);
    //   wanderDirection.normalize();
    //   console.log('wander direction is', wanderDirection);

    //   // Set the velocity of the NPC's physics body to move in the wander direction
    //   body.setVelocity(wanderDirection.x * speed, wanderDirection.y * speed);
    // }

    // const wonder = (caseNum?: number) => {
    //   switch (caseNum) {
    //     case 1:
    //       wonder1();
    //       break;
    //     // case 2:
    //     //   wonder2();
    //     //   break;
    //     default:
    //       wonder1();
    //   }
    // };

    // if (player && player.detectable) {
    //   // Calculate the distance between the NPC and the player
    //   const distance = Phaser.Math.Distance.Between(this.x, this.y, player.x, player.y);

    //   if (distance <= 60) {
    //     body.setVelocity(0, 0);
    //   } else if (distance > 60 && distance < this.detectionRadius) {
    //     // Calculate the direction vector from the NPC to the player
    //     const direction = new Phaser.Math.Vector2(player.x - this.x - player.width, player.y - this.y - player.width).normalize();
  
    //     // Set the velocity of the NPC's physics body to move in the direction of the player
    //     body.setVelocity(direction.x * speed, direction.y * speed);
    //   } else {
    //     wonder(1);
    //   }
    // } else {
    //   wonder(1);
    // }
    // else {
    //   // Move the NPC randomly if the player is not present
    //   const randomVelocity = new Phaser.Math.Vector2(Math.random() * 2 - 1, Math.random() * 2 - 1).normalize();
    //   body.setVelocity(randomVelocity.x * speed, randomVelocity.y * speed);
    // }

    this.healthBar.update();
    this.setToolTipText();
  }
}