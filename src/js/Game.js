export default class Game {
  constructor(document) {
    this.framesDiv = document.querySelector('.frame-num > .value')
    this.secondsDiv = document.querySelector('.seconds-passed > .value')
    this.startTime = Date.now()
  }

  update(tFrame) {
    this.framesDiv.innerHTML = tFrame
    this.secondsDiv.innerHTML = (Date.now() - this.startTime) / 1000
  }

  mainLoop() {
    const main = (tFrame) => {
      this.stopMain = window.requestAnimationFrame(main)
      this.update(tFrame) // pass rAF's timestamp.
      // render();
    }
    main()
  }
}
