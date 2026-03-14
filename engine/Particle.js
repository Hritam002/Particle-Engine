export class Particle {
  constructor() {
    this.originX = 0;
    this.originY = 0;
    this.originZ = 0;

    const theta = Math.random() * Math.PI * 2;
    const phi = Math.random() * Math.PI;

    const speed = Math.random() * 6 + 2;
    this.speed = speed;

    this.vx = Math.cos(theta) * Math.sin(phi) * speed;
    this.vy = Math.sin(theta) * Math.sin(phi) * speed;
    this.vz = Math.cos(phi) * speed;

    this.animationOffset = Math.random() * Math.PI * 2;

    this.x = 0;
    this.y = 0;
    this.z = 0;
  }

  applyTimeline(t) {
    this.x = this.originX + this.vx * 300 * t;
    this.y = this.originY + this.vy * 300 * t;
    this.z = this.originZ + this.vz * 300 * t;
  }
}
