import Phaser, { Physics } from "phaser";
import sky from "./assets/sky.png";
import { Player } from "./player";
import mapJson from "./assets/maps/Meadow.json";
import mapImage from "./assets/maps/Meadow.png";
import TsGrass from "./assets/maps/TilesetGrass.png";
import TsPlant from "./assets/maps/Plant.png";
import TsProps from "./assets/maps/Props.png";
import TsShadowPlant from "./assets/maps/ShadowPlant.png";
import TsStoneGround from "./assets/maps/TilesetStoneGround.png";
import { BaseNpc } from "./npcs/base_npc";
// import playerImage from "./assets/player.png";

const config = {
  type: Phaser.AUTO,
  scale: {
    mode: Phaser.Scale.RESIZE,
    autoCenter: Phaser.Scale.CENTER_BOTH,
  },
  physics: {
    default: "arcade",
    arcade: {
      debug: false,
    },
  },
};

const game = new Phaser.Game(config);

export type AttackCursors = {
  primary: Phaser.Input.Keyboard.Key
  secondary: Phaser.Input.Keyboard.Key
  tertiary: Phaser.Input.Keyboard.Key
}

export interface IGameState extends Phaser.Scene {
  getGroupByName(name: string): Phaser.GameObjects.Group;
  createAttackKeys(): AttackCursors;
}

export class GameState extends Phaser.Scene {

  // Depths for game objects
  private groundLayerDepth: Number = 0;
  private gameObjectDepth: Number = 1;
  private plantLayerDepth: Number = 3;

  // private player: Phaser.GameObjects.Rectangle = this.add.rectangle(this.scale.width / 10, this.scale.height / 10, 32, 32, 0x000000);
  private player!: Player;
  private groups: Physics.Arcade.Group[] = [];
  private npcs: BaseNpc[] = [];
  private npcsGroup!: Phaser.Physics.Arcade.Group;
  private map!: Phaser.Tilemaps.Tilemap;
  private groundLayer!: Phaser.Tilemaps.TilemapLayer | null;
  private propsLayer!: Phaser.Tilemaps.TilemapLayer | null;
  private plantLayer!: Phaser.Tilemaps.TilemapLayer | null;
  private shadowLayer!: Phaser.Tilemaps.TilemapLayer | null;

  // UI elements
  private resetButton!: Phaser.GameObjects.Text;
  private colliderCount: number = 0;
  private damageText: string[] = [];

  constructor() {
    super("game");
  }

  preload() {
    // this.load.image("sky", sky);
    // this.load.image("mapImage", mapImage);
    this.load.tilemapTiledJSON("map", mapJson);
    this.load.image("tsGrass", TsGrass);
    this.load.image("tsPlant", TsPlant);
    this.load.image("tsProps", TsProps);
    this.load.image("tsShadowPlant", TsShadowPlant);
    this.load.image("tsStoneGround", TsStoneGround);
  }

  create() {
    console.log("creating game");
    // const { width, height } = this.scale;
    // const sky = this.add.image(0, 0, "sky");
    // sky.setOrigin(0, 0);
    // sky.setScale(width / sky.width, height / sky.height);

    const { width, height } = this.scale;

    // Add a black rectangle that covers the entire game world
    const bg = this.add.rectangle(0, 0, width, height, 0x000000);
    bg.setOrigin(0, 0);

    // this.player = this.add.rectangle(width / 2, height / 2, 32, 32, 0x000000);

    this.map = this.make.tilemap({ key: "map" });
    const tileset = this.map.addTilesetImage("TilesetGrass", "tsGrass");
    const tileset2 = this.map.addTilesetImage("ShadowPlant", "tsShadowPlant");
    const tileset3 = this.map.addTilesetImage("Plant", "tsPlant");
    const tileset4 = this.map.addTilesetImage("Props", "tsProps");
    if (tileset) {
      this.groundLayer = this.map.createLayer("Grass", tileset);
      this.groundLayer?.setDepth(0);
    }
    if (tileset2) {
      this.shadowLayer = this.map.createLayer("Shadows", tileset2);
      this.shadowLayer?.setDepth(0);
    }
    if (tileset3) {
      this.plantLayer = this.map.createLayer("Trees", tileset3);
      this.plantLayer?.setDepth(2);
    }
    if (tileset4) {
      this.propsLayer = this.map.createLayer("Props", tileset4);
      this.propsLayer?.setDepth(0);
    }

    if (this.groundLayer) {
      this.physics.add.existing(this.groundLayer, true);
    }
    if (this.propsLayer) {
      this.physics.add.existing(this.propsLayer, true);
    }

    // const physics = this.physics;
    const worldWidth = this.map.widthInPixels;
    const worldHeight = this.map.heightInPixels;
    this.physics.world.setBounds(0, 0, worldWidth - 2, worldHeight - 2);
    console.log(this.physics.world);

    // Load player
    this.player = new Player(this);
    this.player = this.player;

    this.npcsGroup = this.physics.add.group({
      collideWorldBounds: true,
      name: "NPCs"
    });

    // Add handle for Groups
    this.groups.push(this.npcsGroup);

    this.physics.add.collider(this.npcsGroup, this.player);
    // this.npcsGroup.enableBody = true;
    // Initialize NPC's
    this.spawnNpcs(10);

    // Generate colliders between all game objects
    // this.generateColliders();

    this.createUi();
  }

  update() {
    // Update player object
    this.player.update();

    // Update NPC objects
    for (const npc of this.npcs) {
      npc.update();
    }

    const colliders = this.physics.world.colliders.getActive().length;
    if (colliders !== this.colliderCount) {
      this.colliderCount = colliders;
      console.log(`Colliders: ${this.colliderCount}`);
    }
  }

  spawnNpcs(quantity: number) {
    // Load NPCs
    for (let i = 0; i < quantity; i++) {
      const npc = new BaseNpc(this);
      this.npcs.push(npc);

      this.add.existing(npc);
      this.npcsGroup.add(npc);
      npc.extraDestroy = this.npcsGroup.remove.bind(this.npcsGroup);
    }

    console.log(this.npcsGroup);
  }

  generateColliders() {
    // Create colliders between all game objects in the scene
    const gameObjects = this.children.getAll();
    for (let i = 0; i < gameObjects.length; i++) {
      for (let j = i + 1; j < gameObjects.length; j++) {
        const object1 = gameObjects[i];
        const object2 = gameObjects[j];
        if (object1 instanceof Phaser.GameObjects.GameObject && object2 instanceof Phaser.GameObjects.GameObject) {
          this.physics.add.collider(object1, object2);
        }
      }
    }
  }

  createUi() {
    // Add a reset button
    this.resetButton = this.add.text(10, 10, "Spawn NPCs", { color: "#ffffff" })
      .setInteractive()
      .on("pointerdown", () => {
        // Reset the game state value
        // this.gameStateValue = 0;
        // this.updateGameStateText();
        this.spawnNpcs(10);
        // this.generateColliders();
      });
    this.resetButton.setScrollFactor(0);

    // Add a game state text box
    // this.gameStateValue = 0;
    // this.gameStateText = this.add.text(10, 50, `Game State: ${this.gameStateValue}`, { fill: "#ffffff" });
  }

  getGroupByName(name: string): Phaser.Physics.Arcade.Group | undefined {
    return this.groups.find(group => group.name === name);
  }

  createAttackKeys() {
    return {
      primary: this.input.keyboard?.addKey(Phaser.Input.Keyboard.KeyCodes.J),
      secondary: this.input.keyboard?.addKey(Phaser.Input.Keyboard.KeyCodes.K),
      tertiary:this.input.keyboard?.addKey(Phaser.Input.Keyboard.KeyCodes.L)
    };
  }
}

game.scene.add("game", GameState);
game.scene.start("game");