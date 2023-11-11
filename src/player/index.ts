import Phaser from "phaser";
import { AttackCursors, GameState, IGameState } from "..";
import { IBaseNpc } from "../npcs/base_npc";
import Weapon from "../weapons/hammer";

export class Player extends Phaser.GameObjects.Rectangle {
  private movementCursors!: Phaser.Types.Input.Keyboard.CursorKeys;
  private attackCursors!: AttackCursors;
  public name: string = "player";
  // private weapon: Weapon;

  constructor(scene: Phaser.Scene) {
    super(scene, scene.scale.width / 2, scene.scale.height / 2, 32, 32, 0x000000);
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

    this.movementCursors = scene.input.keyboard.createCursorKeys();

    // Set up the camera to follow the player
    scene.cameras.main.startFollow(this);
    scene.cameras.main.setFollowOffset(0, 0);
    scene.cameras.main.setBounds(0, 0, scene.physics.world.bounds.width, scene.physics.world.bounds.height);

    // this.weapon = new Weapon(scene, this);
    this.attackCursors = (scene as IGameState).createAttackKeys();
  }

  update() {
    const speed = 200;
    const body = this.body as Phaser.Physics.Arcade.Body;

    // Prevent jittering and clipping effect when the player collides with the world boundary
    if (body && (body.blocked.left || body.blocked.right || body.blocked.up || body.blocked.down)) {
      const overlapLeft = Math.abs(body.left - this.scene.physics.world.bounds.left);
      const overlapRight = Math.abs(body.right - this.scene.physics.world.bounds.right);
      const overlapUp = Math.abs(body.top - this.scene.physics.world.bounds.top);
      const overlapDown = Math.abs(body.bottom - this.scene.physics.world.bounds.bottom);

      if (overlapLeft < overlapRight && overlapLeft < overlapUp && overlapLeft < overlapDown) {
        this.x += overlapLeft;
      } else if (overlapRight < overlapLeft && overlapRight < overlapUp && overlapRight < overlapDown) {
        this.x -= overlapRight;
      } else if (overlapUp < overlapLeft && overlapUp < overlapRight && overlapUp < overlapDown) {
        this.y += overlapUp;
      } else if (overlapDown < overlapLeft && overlapDown < overlapRight && overlapDown < overlapUp) {
        this.y -= overlapDown;
      }
    }

    if (this.movementCursors.left.isDown) {
      this.x -= speed * this.scene.game.loop.delta / 1000;
    } else if (this.movementCursors.right.isDown) {
      this.x += speed * this.scene.game.loop.delta / 1000;
    }

    if (this.movementCursors.up.isDown) {
      this.y -= speed * this.scene.game.loop.delta / 1000;
    } else if (this.movementCursors.down.isDown) {
      this.y += speed * this.scene.game.loop.delta / 1000;
    }

    if (this.attackCursors.primary.isDown) {
      this.attack(20);
    }
    if (this.attackCursors.secondary.isDown) {
      this.attack(50);
    }
    if (this.attackCursors.tertiary.isDown) {
      this.attack(100);
    }

    // this.weapon.update();
  }

  attack(damageValue: number) {
    const npcsGroup = (this.scene as IGameState).getGroupByName("NPCs") as Phaser.Physics.Arcade.Group;
    const npcs = npcsGroup.getChildren() as IBaseNpc[];
    console.log("Attacking npcs!", npcs);

    for (const npc of npcs) {
      const distance = Phaser.Math.Distance.Between(this.x, this.y, npc.x, npc.y);

      if (distance <= 150) {
        npc.healthUpdates(damageValue);
      }
    }
  }
}