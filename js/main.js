(() => {
  const CANVAS_WIDTH = 1446;
  const CANVAS_HEIGHT = 5034;

  const wrapper = document.getElementById("canvas-wrapper");

  function resize() {
    const scale = Math.min(window.innerWidth / CANVAS_WIDTH, 1);
    document.documentElement.style.setProperty("--scale", scale.toString());
    wrapper.style.height = `${CANVAS_HEIGHT * scale}px`;
  }

  window.addEventListener("resize", resize);
  resize();
})();
