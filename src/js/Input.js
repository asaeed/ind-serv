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

  setDirection(direction, value) {
    if (!Object.prototype.hasOwnProperty.call(this.directionPress, direction)) return
    this.directionPress[direction] = value
    if (direction === 'left') this.lastXDirection = 'left'
    if (direction === 'right') this.lastXDirection = 'right'
  }

  setInteract(value) {
    this.interactPress = value
  }

  setSwitchCharacter(value) {
    this.switchCharacterPress = value
  }

  handleKey(e, value) {
    // don't hijack keys while typing in the contact form (email / message fields)
    const el = document.activeElement
    if (el && (el.tagName === 'INPUT' || el.tagName === 'TEXTAREA')) return

    // arrow keys and WASD both move (desktop)
    switch (e.key) {
      case 'ArrowUp':
      case 'w':
      case 'W':
        e.preventDefault()
        this.setDirection('up', value)
        break
      case 'ArrowDown':
      case 's':
      case 'S':
        e.preventDefault()
        this.setDirection('down', value)
        break
      case 'ArrowLeft':
      case 'a':
      case 'A':
        e.preventDefault()
        this.setDirection('left', value)
        break
      case 'ArrowRight':
      case 'd':
      case 'D':
        e.preventDefault()
        this.setDirection('right', value)
        break
      case ' ':
        e.preventDefault()
        this.setInteract(value)
        break
      case 'Tab':
        e.preventDefault()
        this.setSwitchCharacter(value)
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
