import Phaser from "phaser";
import merge from "lodash.merge";
import { AttackCursors, GameState, IGameState } from "../../";
import { IBaseNpc } from "../npcs/base_npc";
import Weapon from "../../weapons/hammer";
import { HealthBar } from "../../ui/healthbar";
import { Teleport } from "./abilities";

interface MovementKeys {
  up: Phaser.Input.Keyboard.Key;
  left: Phaser.Input.Keyboard.Key;
  down: Phaser.Input.Keyboard.Key;
  right: Phaser.Input.Keyboard.Key;
};

interface AbilityKeys {
  teleport: Phaser.Input.Keyboard.Key;
}

interface Abilities {
  teleport: Teleport;
}

interface AttackObj {
  cooldown: boolean;
  time: number;
  damage: number;
  multiplier: number;
}

const default_options = {
  health: 1000,
  width: 32,
  height: 32
}

export class Player extends Phaser.Physics.Arcade.Sprite {
  // private movementCursors!: Phaser.Types.Input.Keyboard.CursorKeys;
  private attackCursors!: AttackCursors;
  public name: string = "player";
  // private weapon: Weapon;
  private movementCursors!: {
    up: Phaser.Input.Keyboard.Key,
    left: Phaser.Input.Keyboard.Key,
    down: Phaser.Input.Keyboard.Key,
    right: Phaser.Input.Keyboard.Key
  };
  health: number;
  maxHealth: number;
  private healthBar: HealthBar;
  score: number = 0;
  private cooldowns: AttackObj[] = [
    {
      cooldown: false,
      time: 500,
      damage: 200,
      multiplier: 1,
    },
    {
      cooldown: false,
      time: 1500,
      damage: 500,
      multiplier: 1,
    },
    {
      cooldown: false,
      time: 5000,
      damage: 1000,
      multiplier: 1,
    }
  ]
  public detectable = true;
  private isRunning = false;
  private abilityKeys!: {
    teleport: Phaser.Input.Keyboard.Key;
  };
  private abilities: Abilities = {
    teleport: new Teleport(),
  };

  constructor(scene: Phaser.Scene, options?: any) {
    options = merge(default_options, options);
    const { health, speed, width, height, extraDestroy } = options;

    const color = options.color instanceof Phaser.Display.Color ? options.color : Phaser.Display.Color.GetColor32(0,0,0,0);
    const colorName = `rectangle-${color.color32}`;

    const graphics = scene.add.graphics();
    graphics.fillStyle(color.color, 1);
    graphics.fillRect(0, 0, 32, 32);
    graphics.generateTexture(colorName, 32, 32);
    graphics.destroy();

    super(scene, scene.scale.width / 2, scene.scale.height / 2, colorName);
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

    // this.weapon = new Weapon(scene, this);
    this.attackCursors = this.createAttackKeys(scene.input);

    this.movementCursors = scene.input.keyboard.addKeys({
      up: Phaser.Input.Keyboard.KeyCodes.W,
      left: Phaser.Input.Keyboard.KeyCodes.A,
      down: Phaser.Input.Keyboard.KeyCodes.S,
      right: Phaser.Input.Keyboard.KeyCodes.D
    }) as MovementKeys;

    this.abilityKeys = scene.input.keyboard.addKeys({
      teleport: Phaser.Input.Keyboard.KeyCodes.SPACE,
    }) as AbilityKeys;

    this.health = health;
    this.maxHealth = health;

    this.setData("health",this.health);
    this.setData("maxHealth", this.maxHealth);

    this.healthBar = new HealthBar(scene, this);

    scene.input.keyboard.on("keydown", (event: KeyboardEvent) => {
      if (event.key === "R" || event.key === "r") {
        this.isRunning = !this.isRunning;
      }
    });
  }

  setCameraFollow() {
    // Set up the camera to follow the player
    const { scene } = this;
    scene.cameras.main.startFollow(this);
    scene.cameras.main.setFollowOffset(0, 0);
    scene.cameras.main.setBounds(-210, -210, scene.physics.world.bounds.width + 210, scene.physics.world.bounds.height + 210 + 300);
  }

  update() {
    const speed = this.isRunning ? 500 : 250;
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

    let xVector = 0;
    let yVector = 0;

    if (this.movementCursors.left.isDown) {
      this.x -= speed * this.scene.game.loop.delta / 1000;
      xVector = -1;
    } else if (this.movementCursors.right.isDown) {
      this.x += speed * this.scene.game.loop.delta / 1000;
      xVector = 1;
    }

    if (this.movementCursors.up.isDown) {
      this.y -= speed * this.scene.game.loop.delta / 1000;
      yVector = -1;
    } else if (this.movementCursors.down.isDown) {
      this.y += speed * this.scene.game.loop.delta / 1000;
      yVector = 1;
    }

    const movementVector = new Phaser.Math.Vector2(xVector, yVector);

    if (Phaser.Input.Keyboard.JustDown(this.abilityKeys.teleport)) {
      console.log("teleporting", { x: this.x, y: this.y })
      this.abilities.teleport.use(this, movementVector);
      console.log("dis teleport?", { x: this.x, y: this.y })
    }

    if (this.attackCursors.primary.isDown) {
      this.attack(0);
    }
    if (this.attackCursors.secondary.isDown) {
      this.attack(1);
    }
    if (this.attackCursors.tertiary.isDown) {
      this.attack(2);
    }

    this.healthBar.update();

    // this.weapon.update();
  }

  startCooldown(attackObjIndex: number) {
    const { time } = this.cooldowns[attackObjIndex];
    this.cooldowns[attackObjIndex].cooldown = true;
    setTimeout(() => {
      this.cooldowns[attackObjIndex].cooldown = false;
    }, time);
  }

  createAttackKeys(input: Phaser.Input.InputPlugin) {
    if (!input.keyboard)  {
      throw new Error("No keyboard input detected");
    }

    return {
      primary: input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.J),
      secondary: input.keyboard?.addKey(Phaser.Input.Keyboard.KeyCodes.K),
      tertiary: input.keyboard?.addKey(Phaser.Input.Keyboard.KeyCodes.L)
    };
  }

  attack(attackObjIndex: number) {
    const { cooldown, damage } = this.cooldowns[attackObjIndex];

    if (cooldown) {
      console.log('skipping attack!');
      return;
    }

    this.startCooldown(attackObjIndex);

    const npcsGroup = (this.scene as IGameState).getGroupByName("NPCs") as Phaser.Physics.Arcade.Group;
    const npcs = npcsGroup.getChildren() as IBaseNpc[];
    console.log("Attacking npcs!", npcs);

    for (const npc of npcs) {
      const distance = Phaser.Math.Distance.Between(this.x, this.y, npc.x, npc.y);

      if (distance <= 150) {
        npc.healthUpdates(damage);
      }
    }
  }
}