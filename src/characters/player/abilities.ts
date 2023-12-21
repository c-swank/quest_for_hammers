import { Player } from ".";

export class Teleport {
  private cooldown: number;
  private lastUsedTime: number;

  constructor(cooldown: number = 5000) {
    this.cooldown = cooldown;
    this.lastUsedTime = 0;
  }

  public use(player: Player, direction: Phaser.Math.Vector2) {
    const currentTime = Date.now();

    if (currentTime - this.lastUsedTime >= this.cooldown) {
      const newPosition = {
        x: player.x + direction.x * 1000,
        y: player.y + direction.y * 1000
      };

      player.setPosition(newPosition.x, newPosition.y);
      this.lastUsedTime = currentTime;

      this.particleEffect(player);
    }
  }


  particleEffect(player: Player) {
    const shape1 = new Phaser.Geom.Circle(0, 0, 80);

    const quantity = 10;
    const particles = player.scene.add.particles(player.x, player.y, 'star', {
      angle: { min: 0, max: 360 },
      // radial: true,
      // rotate: 360,
      lifespan: 500,
      speed: 100,
      quantity,
      scale: { start: 0.5, end: 0.1 },
      blendMode: 'ADD'
      // lifespan: { min: 2000, max: 3000 },
      // follow: player
    });

    particles.addEmitZone({ source: shape1, type: 'edge', quantity: 64, yoyo: false, total: 1 });

    const colorGradient = {
      onEmit: (particle: Phaser.GameObjects.Particles.Particle) => {
        particle.tint = Phaser.Display.Color.GetColor(255, 255, 255); // Set the initial color
      },
      onUpdate: (particle: Phaser.GameObjects.Particles.Particle, key: string, t: number) => {
        const color = Phaser.Display.Color.Interpolate.ColorWithColor(
          new Phaser.Display.Color(255, 255, 255), // Start color (white)
          new Phaser.Display.Color(255, 0, 0), // End color (red)
          100, // Color steps
          Math.floor(t * 100) // Current step based on time
        );
        particle.tint = Phaser.Display.Color.ObjectToColor(color).color;
      }
    };

    player.scene.events.on('update', () => {
      const angle = player.scene.time.now / 100; // Adjust the speed of rotation
      const radius = 1; // Adjust the radius of the circle

      const x = player.x + Math.cos(angle) * radius;
      const y = player.y + Math.sin(angle) * radius;

      particles.setPosition(player.x, player.y);
    });

    setTimeout(() => {
      particles.stop();
    }, 2000);
  }
}