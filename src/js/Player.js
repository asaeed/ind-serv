import Character from './Character'

export default class Player extends Character {
  constructor(layer, imagePath, x, y) {
    super(layer, imagePath, x, y)
  }

  update(input, map, stage) {
    if (!this.sprite) return

    this.facingDirection = input.lastXDirection
    if (this.sprite) this.sprite.scaleX(this.scale * (this.facingDirection === 'right' ? 1 : -1))

    const speed = 4
    const press = input.directionPress
    if (press.up) {
      const newY = this.sprite.attrs.y - speed
      if (map.isVacant(this.sprite.attrs.x, newY)) this.sprite.y(newY)
    }

    if (press.down) {
      const newY = this.sprite.attrs.y + speed
      if (map.isVacant(this.sprite.attrs.x, newY)) this.sprite.y(newY)
    }

    if (press.left) {
      const newX = this.sprite.attrs.x - speed
      if (map.isVacant(newX, this.sprite.attrs.y)) this.sprite.x(newX)
    }

    if (press.right) {
      const newX = this.sprite.attrs.x + speed
      if (map.isVacant(newX, this.sprite.attrs.y)) this.sprite.x(newX)
    }

    if (press.up || press.down || press.left || press.right) {
      this.sprite.animation('walk')
    } else {
      this.sprite.animation('idle')
    }

    // move map and items on it to follow player
    const xThreshDistance = 200
    const yThreshDistance = 100
    const xFromCenter = stage.width() / 2 - this.sprite.attrs.x
    const yFromCenter = stage.height() / 2 - this.sprite.attrs.y - 32

    // if user has strayed more than threshold and animation is not already running
    if (Math.abs(xFromCenter) > xThreshDistance) {
      const delta = speed * (xFromCenter > 0 ? 1 : -1)
      map.imageGroup.move({ x: delta, y: 0 })
      this.sprite.move({ x: delta, y: 0 })
    }

    if (Math.abs(yFromCenter) > yThreshDistance) {
      const delta = speed * (yFromCenter > 0 ? 1 : -1)
      map.imageGroup.move({ x: 0, y: delta })
      this.sprite.move({ x: 0, y: delta })
    }

    // if (Math.abs(yFromCenter) > yThreshDistance && !this.yAnimRunning) {
    //   const velocity = 250 * (yFromCenter < 0 ? -1 : 1)
    //   const anim = new Konva.Animation((frame) => {
    //     let dist = velocity * (frame.timeDiff / 1000)
    //     map.imageGroup.move({ x: 0, y: dist })
    //     this.sprite.move({ x: 0, y: dist })
    //   })

    //   anim.start()
    //   this.yAnimRunning = true

    //   setTimeout(() => {
    //     anim.stop()
    //     this.yAnimRunning = false
    //   }, 800)
    // }
  }
}
