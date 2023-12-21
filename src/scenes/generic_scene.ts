import Phaser, { Physics } from "phaser";
import "phaser3-rex-plugins/plugins/gridtable-plugin.js";
import 'phaser3-rex-plugins/templates/ui/ui-plugin.js';
import UIPlugin from "phaser3-rex-plugins/templates/ui/ui-plugin.js";
import sky from "./assets/sky.png";
import defaultBackground from "../assets/sky.png";
import { Player } from "../characters/player";
import mapJson from "./assets/maps/Meadow.json";
import mapImage from "./assets/maps/Meadow.png";
import TsGrass from "../assets/maps/TilesetGrass.png";
import TsPlant from "../assets/maps/Plant.png";
import TsProps from "../assets/maps/Props.png";
import TsShadowPlant from "../assets/maps/ShadowPlant.png";
import TsStoneGround from "../assets/maps/TilesetStoneGround.png";
import { BaseNpc } from "../characters/npcs/base_npc";
import eventManager, { EventManager } from "../gamestate/events";
// import playerImage from "./assets/player.png";

console.log(TsGrass);

const assets: { [key: string]: any } = {
  TsGrass,
  TsPlant,
  TsProps,
  TsShadowPlant,
  TsStoneGround,
};

export type AttackCursors = {
  primary: Phaser.Input.Keyboard.Key
  secondary: Phaser.Input.Keyboard.Key
  tertiary: Phaser.Input.Keyboard.Key
}

export interface IGameState extends Phaser.Scene {
  getGroupByName(name: string): Phaser.GameObjects.Group;
  createAttackKeys(): AttackCursors;
}

export default class BaseScene extends Phaser.Scene {

  // Depths for game objects
  private groundLayerDepth: Number = 0;
  private gameObjectDepth: Number = 1;
  private plantLayerDepth: Number = 3;

  // private player: Phaser.GameObjects.Rectangle = this.add.rectangle(this.scale.width / 10, this.scale.height / 10, 32, 32, 0x000000);
  private player!: Player;
  private groups: Physics.Arcade.Group[] = [];
  private npcs: BaseNpc[] = [];
  private npcsGroup!: Phaser.Physics.Arcade.Group;
  public map!: Phaser.Tilemaps.Tilemap;
  public mapWidth: number = 50;
  public mapHeight: number = 50;
  public groundLayer!: Phaser.Tilemaps.TilemapLayer | null;
  private propsLayer!: Phaser.Tilemaps.TilemapLayer | null;
  private plantLayer!: Phaser.Tilemaps.TilemapLayer | null;
  private shadowLayer!: Phaser.Tilemaps.TilemapLayer | null;
  // private eventManager: EventManager;

  // UI elements
  private resetButton!: Phaser.GameObjects.Text;
  private gameStateText: { 
    [key: string]: {
      text: Phaser.GameObjects.Text,
      place: [number, number]
    }
  } = {};
  private gameStateTextContent: {[key: string]: number} = {
    spawned: 0,
    killed: 0,
    damage: 0, 
  };
  private colliderCount: number = 0;
  private damageText: string[] = [];
  private miniMap?: Phaser.GameObjects.Graphics;
  private miniMapObjects: {
    player?: Phaser.GameObjects.Arc,
    npcs?: Phaser.GameObjects.Graphics[],
    loot?: Phaser.GameObjects.Graphics[],
  } = {};
  private doLoadSkybox: boolean = true;
  private rexUI!: UIPlugin;
  private abilitiesBar!: Phaser.GameObjects.GameObject;

  constructor(...options: any[]) {
    console.log("loading with options", ...options);
    super(...options);
  }

  preload(options: any) {
    if (options.preload) {
      console.log('preloading assets', options);
      options.preload.forEach((ass: string) => {
        console.log('preloading image', assets[ass]);
        this.load.image(ass, assets[ass]);
      });
    }
    
    this.load.image("default_background", defaultBackground);
  }


  loadPlayer() {
    this.player = new Player(this);
    this.player = this.player;
  }

  loadPhysics() {
    const worldWidth = this.map.widthInPixels;
    const worldHeight = this.map.heightInPixels;
    console.log('loading physics for map', this.map);
    this.physics.world.setBounds(0, 0, worldWidth - 2, worldHeight - 2);

    if (this.groundLayer) {
      this.physics.add.existing(this.groundLayer, true);
    }

    this.npcsGroup = this.physics.add.group({
      collideWorldBounds: true,
      name: "NPCs"
    });

    // Add handle for Groups
    this.groups.push(this.npcsGroup);

    this.physics.add.collider(this.npcsGroup, this.player);
  }

  loadMap() {

  }

  renderMiniMap() {
    // Create minimap if it does not exist
    const scaleFactor = 0.125;
    const scaleFactorH = scaleFactor * 0.9
    const miniMapWidth = 200;
    const miniMapHeight = 150;
    if (!this.miniMap) {
      const minimapBackground = this.add.graphics();
      minimapBackground.setPosition(this.cameras.main.width - 210, 10);
      minimapBackground.fillStyle(0x111000, 0.8);
      minimapBackground.fillRect(0, 0, miniMapWidth, miniMapHeight);
      this.miniMap = minimapBackground;
      this.miniMap.setScrollFactor(0);
    }

    // console.log('minimap data', { mini: this.miniMap});
    if (this.miniMap.x < 0 || this.miniMap.y > this.map.widthInPixels) {
      this.miniMap.fillStyle(0xffffff, 0.5);
    }

    const scale = (miniMapWidth / this.map.widthInPixels);
    const scaleH = (miniMapHeight / this.map.heightInPixels);
    const playerMiniMapPosX = this.player.x * scale + this.cameras.main.width - 210;

    if (this.player && !this.miniMapObjects.player) {
      this.miniMapObjects.player = this.add.circle(playerMiniMapPosX, this.player.y * scaleH + 10, 2, 0x00ff00);
      this.miniMapObjects.player.setScrollFactor(0);
    } else if (this.player && this.miniMapObjects.player) {
      this.miniMapObjects.player.setPosition(playerMiniMapPosX, this.player.y * scaleH + 10);
    }

    // // Set the minimap background and player to scroll with the camera
    this.cameras.main.scrollX = 0; // Reset camera scroll
    this.cameras.main.scrollY = 0; // Reset camera scroll
  }

  loadPlugins() {
    // this.plugins.installScenePlugin("rexUI", UIPlugin);
  }

  create() {
    console.log("creating scene");
    this.loadPlugins();

    console.log("loading map");
    this.loadMap();

    if (this.doLoadSkybox) {
      const skybox = this.add.image(-220, -220, "default_background");
      skybox.setDepth(-1);
      skybox.setOrigin(0, 0);
      skybox.setScale((this.map.widthInPixels + 220) / skybox.width, (this.map.heightInPixels + 440) / skybox.height);
      // skybox.texture.setFilter(Phaser.Textures.FilterMode.NEAREST);
    }

    this.loadPhysics();

    this.createUi();

    this.loadPlayer();

    this.player.setCameraFollow();

    this.renderMiniMap();
  }

  update() {
    // Update player object
    if (this.player) {
      this.player.update();
    }

    // Update NPC objects
    for (const npc of this.npcs) {
      npc.update();
    }

    const colliders = this.physics.world.colliders.getActive().length;
    if (colliders !== this.colliderCount) {
      this.colliderCount = colliders;
      // console.log(`Colliders: ${this.colliderCount}`);
    }

    this.updateUi();
    this.renderMiniMap();
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

    this.gameStateTextContent.spawned += quantity;

    // console.log(this.npcsGroup);
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

  createAbilitiesBarUi() {
    console.log("creating abilities bar");
    const abilitiesBar = this.add.container(0, this.scale.height - 100); // Adjust the Y position as needed

    const gridSize = 5; // Number of columns in the grid
    const squareSize = 80; // Size of each square in pixels

    console.log("rex", this.rexUI);

    // Create the grid
    const grid = this.rexUI.add.gridTable({
      x: 0,
      y: 0,
      width: gridSize * squareSize,
      height: 2 * squareSize,
      scrollMode: 0,
      table: {
        columns: gridSize,
        mask: {
          padding: 2,
        },
        reuseCellContainer: true,
      },
      createCellContainerCallback: (cell: any, cellContainer: Phaser.GameObjects.GameObject | null) => {
        console.log("creating cell container");
        const myCell = cellContainer as Phaser.GameObjects.Container;
        const icon = this.add.image(0, 0, "ability_icon"); // Replace "ability_icon" with your actual icon image key
        icon.setScale(squareSize / icon.width); // Scale the icon to fit the square size
        if (cellContainer) {
          console.log("cell container", cellContainer);
          myCell.add(icon);
          const outline = this.add.graphics();
          outline.lineStyle(2, 0xffffff); // Set the line style to white with a thickness of 2 pixels
          outline.strokeRect(-squareSize / 2, -squareSize / 2, squareSize, squareSize); // Draw a rectangle outline around the cell
          myCell.add(outline);
        } else {
          console.log("no cell container, creating empty cells");
          const emptyCell = this.add.graphics();
          emptyCell.fillStyle(0x000000, 0.5); // Set the fill style to a semi-transparent black color
          emptyCell.fillRect(-squareSize / 2, -squareSize / 2, squareSize, squareSize); // Draw a filled rectangle as the empty cell
          myCell.add(emptyCell);
        }

        return myCell;
      },
      items: [
        { icon: "ability_icon_1", name: "Ability 1" },
      ]
    }).layout();

    abilitiesBar.add(grid);

    // Set the position of the Abilities bar
    abilitiesBar.x = (this.scale.width - grid.width) / 2; // Center the Abilities bar horizontally
    abilitiesBar.y = this.scale.height - abilitiesBar.height; // Bottom of screen
    abilitiesBar.setScrollFactor(0); // Make the Abilities bar fixed on the screen

    // Add the Abilities bar to the scene
    this.add.existing(abilitiesBar);
    console.log("abilities bar", abilitiesBar);
  }

  createBasicAbilitiesBar() {
    const gridSize = 5; // Number of columns in the grid
    const rowSize = 2;
    const squareSize = 50; // Size of each square in pixels
    const squareBuffer = 10;
    const screenHeight = this.scale.height;
    const abilitiesBarWidth = gridSize * squareSize + (gridSize - 1) * squareBuffer;
    const abilitiesBarHeight = rowSize * squareSize + (rowSize - 1) * squareBuffer;
  
    const items = this.generateGridItems(gridSize, rowSize);

    const abilitiesBar = this.add.container(0, screenHeight - abilitiesBarHeight);
  
    items.forEach((item, index) => {
      const row = Math.floor(index / gridSize);
      const col = index % gridSize;
  
      const square = this.add.graphics();

      square.fillStyle(0x111000, 0.8);

      square.fillRoundedRect(
        col * squareSize + col * squareBuffer,
        row * squareSize + row * squareBuffer,
        squareSize,
        squareSize,
        5
      );

      square.setInteractive(); // Make the square interactive

      square.on('pointerdown', () => {
        // Handle the click event for the square
        console.log(`Square ${index + 1} clicked`);
      });
  
      abilitiesBar.add(square);
    });

    abilitiesBar.setSize(abilitiesBarWidth, abilitiesBarHeight);
    abilitiesBar.setScrollFactor(0);
    abilitiesBar.setDepth(1);
    const abilitiesBarPosition = [(this.scale.width - abilitiesBar.width) / 2, screenHeight - abilitiesBarHeight - 20];
    abilitiesBar.setPosition(...abilitiesBarPosition);

    const graphicsBuffer = 10;
    const graphics = this.add.graphics();
    graphics.fillStyle(0x5b7cb0, 0.7);
    graphics.fillRect(0,0, abilitiesBar.width + graphicsBuffer * 2, abilitiesBar.height + graphicsBuffer * 2);
    graphics.setScrollFactor(0);
    graphics.setPosition(abilitiesBar.x - graphicsBuffer, abilitiesBar.y - graphicsBuffer);

    this.abilitiesBar = abilitiesBar;

    console.log("abilities bar", abilitiesBar);
  }

  generateGridItems(gridSize: number, rowSize: number) {
    const items = [];
    for (let i = 0; i < gridSize * rowSize; i++) {
      items.push({ id: i });
    }
    return items;
  }

  createUi() {
    // Add a reset button
    const resetButton = this.add.text(10, 10, "Spawn NPCs", { color: "red" })
      .setInteractive()
      .on("pointerdown", () => {
        // Reset the game state value
        // this.gameStateValue = 0;
        // this.updateGameStateText();
        this.spawnNpcs(10);
        // this.generateColliders();
      });
    resetButton.setScrollFactor(0);

    // Add a game state text box
    // const gameStateValue = 0;
    // this.gameStateText = this.add.text(10, 50, `Game State: ${gameStateValue}`, { color: "#ffffff" });
    // this.gameStateText.setScrollFactor(0);

    let nextSpace = 40;
    Object.keys(this.gameStateTextContent).forEach((key) => {
      const text = this.add.text(10, nextSpace, `${key}: ${this.gameStateTextContent[key]}`);
      text.setScrollFactor(0);
      this.gameStateText[key] = {
        text,
        place: [10, nextSpace],
      };

      nextSpace += 30;
    });

    this.createBasicAbilitiesBar();
  }

  updateUi() {
    Object.keys(this.gameStateText).forEach((key) => {
      const textObject = this.gameStateText[key];
      textObject.text.setText(`${key}: ${this.gameStateTextContent[key]}`);
    });
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