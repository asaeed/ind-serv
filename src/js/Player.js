import Character from './Character'

export default class Player extends Character {
  constructor(group, imagePath, x, y) {
    super(group, imagePath, x, y)

    this.speed = 4
    // this.isCentering = false
  }

  update(input, map, stage) {
    if (!this.sprite) return

    this.facingDirection = input.lastXDirection
    if (this.sprite) this.sprite.scaleX(this.scale * (this.facingDirection === 'right' ? 1 : -1))

    const press = input.directionPress
    if (press.up) {
      const newY = this.sprite.attrs.y - this.speed
      if (map.isVacant(this.sprite.attrs.x, newY)) this.sprite.y(newY)
    }

    if (press.down) {
      const newY = this.sprite.attrs.y + this.speed
      if (map.isVacant(this.sprite.attrs.x, newY)) this.sprite.y(newY)
    }

    if (press.left) {
      const newX = this.sprite.attrs.x - this.speed
      if (map.isVacant(newX, this.sprite.attrs.y)) this.sprite.x(newX)
    }

    if (press.right) {
      const newX = this.sprite.attrs.x + this.speed
      if (map.isVacant(newX, this.sprite.attrs.y)) this.sprite.x(newX)
    }

    const xFromCenter = stage.width() / 2 - this.sprite.attrs.x + 32
    const yFromCenter = stage.height() / 2 - this.sprite.attrs.y - 32

    if (press.up || press.down || press.left || press.right) {
      this.sprite.animation('walk')
      this.centerCamera(xFromCenter, yFromCenter, 100, 50, this.speed, map)
    } else {
      this.sprite.animation('idle')
      this.centerCamera(xFromCenter, yFromCenter, 10, 10, this.speed / 2, map)
    }
  }

  centerCamera(xFromCenter, yFromCenter, xThresh, yThresh, speed, map) {
    if (Math.abs(xFromCenter) > xThresh) {
      const delta = speed * (xFromCenter > 0 ? 1 : -1)
      map.imageGroup.move({ x: delta, y: 0 })
      this.sprite.move({ x: delta, y: 0 })
    }

    if (Math.abs(yFromCenter) > yThresh) {
      const delta = speed * (yFromCenter > 0 ? 1 : -1)
      map.imageGroup.move({ x: 0, y: delta })
      this.sprite.move({ x: 0, y: delta })
    }
  }

  centerCameraAnim(xFromCenter, yFromCenter, map) {
    // if user has strayed more than threshold and animation is not already running
    if ((Math.abs(yFromCenter) > 10 || Math.abs(xFromCenter) > 10) && !this.isCentering) {
      const anim = new Konva.Animation((frame) => {
        let xDist = xFromCenter * (frame.timeDiff / 1000)
        let yDist = yFromCenter * (frame.timeDiff / 1000)
        map.imageGroup.move({ x: xDist, y: yDist })
        this.sprite.move({ x: xDist, y: yDist })
      })

      anim.start()
      this.isCentering = true

      setTimeout(() => {
        anim.stop()
        this.isCentering = false
      }, 1000)
    }
  }
}
