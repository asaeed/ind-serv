import Konva from 'konva'

export default class Particles {
  constructor(layer) {
    this.layer = layer
    this.particles = []
  }

  createParticles(x, y, count = 6, color = '#8B4513', options = {}) {
    const {
      speedMin = 1,
      speedMax = 3,
      sizeMin = 2,
      sizeMax = 4,
      life = 20,
      yOffset = 0,
      gravityY = -1,
    } = options

    // create small square particles that float upward and fade out
    for (let i = 0; i < count; i++) {
      const angle = (Math.PI * 2 * i) / count
      const speed = speedMin + Math.random() * (speedMax - speedMin)
      const size = sizeMin + Math.random() * (sizeMax - sizeMin)

      const particle = new Konva.Rect({
        x: x,
        y: y + yOffset,
        width: size,
        height: size,
        offsetX: size / 2,
        offsetY: size / 2,
        fill: color,
        opacity: 1,
      })

      this.layer.add(particle)

      this.particles.push({
        shape: particle,
        vx: Math.cos(angle) * speed,
        vy: Math.sin(angle) * speed + gravityY,
        life: life,
        maxLife: life,
      })
    }
  }

  update() {
    // update particles
    for (let i = this.particles.length - 1; i >= 0; i--) {
      const p = this.particles[i]

      p.shape.x(p.shape.x() + p.vx)
      p.shape.y(p.shape.y() + p.vy)
      p.life--

      p.shape.opacity(p.life / p.maxLife)

      if (p.life <= 0) {
        p.shape.destroy()
        this.particles.splice(i, 1)
      }
    }
  }
}
