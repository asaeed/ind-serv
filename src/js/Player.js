import Character from './Character'

export default class Player extends Character {
  update(input, map) {
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
  }
}
