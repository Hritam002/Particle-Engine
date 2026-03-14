import { Particle } from "./Particle.js";

export class SupernovaEngine {
  constructor(count = 4000) {
    this.count = count;
    this.particles = [];

    // timeline: 0 (collapsed) → 1 (fully expanded)
    this.timeline = 0;
    this.timelineSpeed = 0.003;

    this.timelineDirection = 1;

    this.frozen = false;
    this.scrubbing = false;

    this.spawn();
    this.bindMouseControls();
  }

  spawn() {
    this.particles = [];
    for (let i = 0; i < this.count; i++) {
      this.particles.push(new Particle());
    }
  }

  update() {
    if (!this.frozen && !this.scrubbing) {
      this.timeline += this.timelineSpeed * this.timelineDirection;
      if (this.timeline > 1) {
        this.timeline = 1;
        this.timelineDirection = -1;
      } else if (this.timeline < 0) {
        this.timeline = 0;
        this.timelineDirection = 1;
      }
    }

    this.particles.forEach(p => p.applyTimeline(this.timeline));
  }

  bindMouseControls() {
    let lastX = 0;

    window.addEventListener("mousedown", e => {
      if (e.button === 0) {
        this.frozen = true;
        this.scrubbing = true;
        lastX = e.clientX;
      }
    });

    window.addEventListener("mousemove", e => {
      if (!this.scrubbing) return;

      const deltaX = e.clientX - lastX;
      lastX = e.clientX;

      this.timeline += deltaX * 0.002;
      this.timeline = Math.max(0, Math.min(1, this.timeline));
    });

    window.addEventListener("mouseup", e => {
      if (e.button === 0) {
        this.frozen = false;
        this.scrubbing = false;
      }
    });
  }
}