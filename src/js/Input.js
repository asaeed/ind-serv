export default class Input {
  constructor() {
    this.lastXDirection = 'right'
    this.directionPress = {
      up: 0,
      down: 0,
      left: 0,
      right: 0,
    }
    this.interactPress = 0
    this.switchCharacterPress = 0

    document.addEventListener('keydown', this.keyDownHandler, false)
    document.addEventListener('keyup', this.keyUpHandler, false)
  }

  handleKey(e, value) {
    e.preventDefault()
    switch (e.key) {
      case 'ArrowUp':
        this.directionPress.up = value
        break
      case 'ArrowDown':
        this.directionPress.down = value
        break
      case 'ArrowLeft':
        this.directionPress.left = value
        this.lastXDirection = 'left'
        break
      case 'ArrowRight':
        this.directionPress.right = value
        this.lastXDirection = 'right'
        break
      case ' ':
        this.interactPress = value
        break
      case 'Tab':
        this.switchCharacterPress = value
        break
    }
  }

  keyDownHandler = (e) => {
    this.handleKey(e, 1)
  }

  keyUpHandler = (e) => {
    this.handleKey(e, 0)
  }

  dispose() {
    document.removeEventListener('keydown', this.keyDownHandler, false)
    document.removeEventListener('keyup', this.keyUpHandler, false)
  }
}
