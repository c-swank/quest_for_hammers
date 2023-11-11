declare module "*.png" {
  const value: string;
  export default value;
}

declare module "*.json" {
  const value: any;
  export default value;
}

declare module "phaser" {
  namespace GameObjects {
    interface GameObjectFactory {
      player(x: number, y: number): Player;
    }
  }
}