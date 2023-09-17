import Character from './Character'
import villagerMan from '../assets/img/MiniVillagerMan.png'
import gameStore from './gameStore'

export default class Player extends Character {
  constructor(map, input) {
    super(map.layer, villagerMan, map.stage.width() / 2, map.stage.height() / 2)
    this.map = map
    this.input = input
    this.initX = map.stage.width() / 2
    this.initY = map.stage.height() / 2
    this.speed = 4
    this.isJumping = false
  }

  update() {
    if (!this.sprite) return

    this.facingDirection = this.input.lastXDirection
    if (this.sprite) this.sprite.scaleX(this.scale * (this.facingDirection === 'right' ? 1 : -1))

    const press = this.input.directionPress
    if (press.up) {
      const newY = this.sprite.attrs.y - this.speed
      if (this.map.isPixelVacant(this.sprite.attrs.x, newY)) this.sprite.y(newY)
    }

    if (press.down) {
      const newY = this.sprite.attrs.y + this.speed
      if (this.map.isPixelVacant(this.sprite.attrs.x, newY)) this.sprite.y(newY)
    }

    if (press.left) {
      const newX = this.sprite.attrs.x - this.speed
      if (this.map.isPixelVacant(newX, this.sprite.attrs.y)) this.sprite.x(newX)
    }

    if (press.right) {
      const newX = this.sprite.attrs.x + this.speed
      if (this.map.isPixelVacant(newX, this.sprite.attrs.y)) this.sprite.x(newX)
    }

    const xFromCenter = this.initX - this.sprite.attrs.x + 32
    const yFromCenter = this.initY - this.sprite.attrs.y - 32

    if (press.up || press.down || press.left || press.right) {
      if (!this.isJumping) this.sprite.animation('walk')
      this.centerCamera(xFromCenter, yFromCenter, 100, 50, this.speed)
    } else {
      if (!this.isJumping) this.sprite.animation('idle')
      this.centerCamera(xFromCenter, yFromCenter, 10, 10, this.speed / 2)
    }

    // interaction should fire once, last for the animation duration of 400
    if (this.input.interactPress && !this.isJumping) {
      this.sprite.animation('hurt')
      this.isJumping = true
      setTimeout(() => (this.isJumping = false), 400)

      // to see if player is within range of any and kick off interaction
      const closestNpcName = this.map.checkProximity(this.sprite.attrs.x, this.sprite.attrs.y)
      gameStore.getState().interactWith(closestNpcName)
    }

    // reset text panel on movement
    if ((press.up || press.down || press.left || press.right) && !this.isJumping) {
      gameStore.getState().interactWith(undefined)
    }
  }

  centerCamera(xFromCenter, yFromCenter, xThresh, yThresh, speed) {
    if (Math.abs(xFromCenter) > xThresh) {
      const delta = speed * (xFromCenter > 0 ? 1 : -1)
      this.map.imageGroup.move({ x: delta, y: 0 })
      this.sprite.move({ x: delta, y: 0 })
    }

    if (Math.abs(yFromCenter) > yThresh) {
      const delta = speed * (yFromCenter > 0 ? 1 : -1)
      this.map.imageGroup.move({ x: 0, y: delta })
      this.sprite.move({ x: 0, y: delta })
    }
  }

  // centerCameraAnim(xFromCenter, yFromCenter) {
  //   // if user has strayed more than threshold and animation is not already running
  //   if ((Math.abs(yFromCenter) > 10 || Math.abs(xFromCenter) > 10) && !this.isCentering) {
  //     const anim = new Konva.Animation((frame) => {
  //       let xDist = xFromCenter * (frame.timeDiff / 1000)
  //       let yDist = yFromCenter * (frame.timeDiff / 1000)
  //       this.map.imageGroup.move({ x: xDist, y: yDist })
  //       this.sprite.move({ x: xDist, y: yDist })
  //     })

  //     anim.start()
  //     this.isCentering = true

  //     setTimeout(() => {
  //       anim.stop()
  //       this.isCentering = false
  //     }, 1000)
  //   }
  // }
}
