export default class Input {
  constructor(document) {
    document.addEventListener('keydown', keyDownHandler, false)
    document.addEventListener('keyup', keyUpHandler, false)
  }
}
