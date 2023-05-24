export default class Input {
  constructor(document) {
    this.lastXDirection = 'right'
    this.directionPress = {
      up: 0,
      down: 0,
      left: 0,
      right: 0,
    }
    this.interactPress = 0

    document.addEventListener('keydown', this.keyDownHandler, false)
    document.addEventListener('keyup', this.keyUpHandler, false)
  }

  keyDownHandler = (e) => {
    e.preventDefault()
    switch (e.key) {
      case 'ArrowUp':
        this.directionPress.up = 1
        break
      case 'ArrowDown':
        this.directionPress.down = 1
        break
      case 'ArrowLeft':
        this.directionPress.left = 1
        this.lastXDirection = 'left'
        break
      case 'ArrowRight':
        this.directionPress.right = 1
        this.lastXDirection = 'right'
        break
      case ' ':
        this.interactPress = 1
        break
    }
  }

  keyUpHandler = (e) => {
    e.preventDefault()
    switch (e.key) {
      case 'ArrowUp':
        this.directionPress.up = 0
        break
      case 'ArrowDown':
        this.directionPress.down = 0
        break
      case 'ArrowLeft':
        this.directionPress.left = 0
        this.lastXDirection = 'left'
        break
      case 'ArrowRight':
        this.directionPress.right = 0
        this.lastXDirection = 'right'
        break
      case ' ':
        this.interactPress = 0
        break
    }
  }
}
