import './css/index.scss'
import Game from './js/Game'
import Game1 from './js/gameModule'

// TODO: mark up in code vs in html?
// document.querySelector('.main-container').innerHTML = `
// <div class="frame-num">
//   <div class="label">Frame number:</div>
//   <div class="value">0</div>
// </div>
// <div class="seconds-passed">
//   <div class="label">Seconds passed:</div>
//   <div class="value">0</div>
// </div>
// `

const game = new Game()
game.mainLoop()
// Game1.setup(document)
// Game1.mainLoop()

// needed for webpack hot reload
if (module.hot) {
  module.hot.accept()
}

// const MyGame = {}
// const framesDiv = document.querySelector('.frame-num > .value')
// const secondsDiv = document.querySelector('.seconds-passed > .value')
// const startTime = Date.now()

// const update = (tFrame) => {
//   framesDiv.innerHTML = tFrame

//   const secondsPassed = (Date.now() - startTime) / 1000
//   secondsDiv.innerHTML = secondsPassed
// }

// // game loop from mozilla
// // https://developer.mozilla.org/en-US/docs/Games/Anatomy
// ;(() => {
//   const main = (tFrame) => {
//     MyGame.stopMain = window.requestAnimationFrame(main)

//     update(tFrame) // pass rAF's timestamp.
//     // render();
//   }

//   main() // start the cycle
// })()
