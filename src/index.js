import "./css/index.scss";

document.querySelector(
  ".container"
).innerHTML = `<div>Hello from Webpack </div>`;

(() => {
  function main(tFrame) {
    MyGame.stopMain = window.requestAnimationFrame(main);

    update(tFrame); // Call your update method. In our case, we give it rAF's timestamp.
    render();
  }

  main(); // Start the cycle
})();
