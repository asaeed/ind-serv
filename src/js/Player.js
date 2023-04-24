import Character from './Character'

export default class Player extends Character {
  update(input) {
    this.facingDirection = input.lastXDirection
    if (this.sprite) this.sprite.scaleX(this.scale * (this.facingDirection === 'right' ? 1 : -1))
  }
}
