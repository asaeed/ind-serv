var framesDiv
var secondsDiv
var startTime
var stopMain

export const setup = (document) => {
  framesDiv = document.querySelector('.frame-num > .value')
  secondsDiv = document.querySelector('.seconds-passed > .value')
  startTime = Date.now()
}

export const update = (tFrame) => {
  framesDiv.innerHTML = tFrame
  secondsDiv.innerHTML = (Date.now() - startTime) / 1000
}

export const mainLoop = () => {
  const main = (tFrame) => {
    stopMain = window.requestAnimationFrame(main)
    update(tFrame) // pass rAF's timestamp.
  }
  main()
}

export default {
  setup,
  mainLoop,
}
