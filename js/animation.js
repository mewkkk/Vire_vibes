// screen1: logo
function mixNumber(start, end, progress) {
  return Math.round(start + (end - start) * progress);
}

function mixColor(firstColor, secondColor, progress) {
  return {
    r: mixNumber(firstColor.r, secondColor.r, progress),
    g: mixNumber(firstColor.g, secondColor.g, progress),
    b: mixNumber(firstColor.b, secondColor.b, progress),
  };
}

function colorText(color, alpha = 1) {
  return "rgba(" + color.r + ", " + color.g + ", " + color.b + ", " + alpha + ")";
}

function getColorByValue(value, startColor, middleColor, endColor) {
  if (value <= 50) {
    return mixColor(startColor, middleColor, value / 50);
  }

  return mixColor(middleColor, endColor, (value - 50) / 50);
}

function startLogo() {
  const logoBox = document.getElementById("logo");
  const logoCanvas = document.getElementById("logo_canvas");
  const logoColor = "#0a4d2c";

  if (!logoBox || !logoCanvas) {
    return;
  }

  const ctx = logoCanvas.getContext("2d");
  const helperCanvas = document.createElement("canvas");
  const helperCtx = helperCanvas.getContext("2d");

  if (!ctx || !helperCtx) {
    return;
  }

  const mouse = {
    x: -9999,
    y: -9999,
    radius: 110,
    inside: false,
  };

  let dots = [];
  let animationFrame = 0;
  let resizeTimer = 0;

  function setCanvasSize() {
    const rect = logoBox.getBoundingClientRect();

    logoCanvas.width = rect.width;
    logoCanvas.height = rect.height;
    helperCanvas.width = rect.width;
    helperCanvas.height = rect.height;
  }

  function buildDots() {
    const width = logoBox.clientWidth;
    const height = logoBox.clientHeight;
    const sidePadding = Math.max(10, width * 0.035);
    let fontSize = Math.min(width / 1.58, height * 0.84);

    helperCtx.font = fontSize + 'px "logo_font"';

    while (helperCtx.measureText("VIRE").width > width - sidePadding * 2 && fontSize > 20) {
      fontSize -= 6;
      helperCtx.font = fontSize + 'px "logo_font"';
    }

    helperCtx.clearRect(0, 0, width, height);
    helperCtx.fillStyle = logoColor;
    helperCtx.textAlign = "center";
    helperCtx.textBaseline = "middle";
    helperCtx.font = fontSize + 'px "logo_font"';
    helperCtx.fillText("VIRE", width / 2, height / 2);

    const imageData = helperCtx.getImageData(0, 0, width, height).data;
    const gap = 2;
    const newDots = [];

    for (let y = 0; y < height; y += gap) {
      for (let x = 0; x < width; x += gap) {
        const index = (y * width + x) * 4 + 3;

        if (imageData[index] > 110) {
          newDots.push({
            homeX: x,
            homeY: y,
            x: x,
            y: y,
            vx: 0,
            vy: 0,
            seed: Math.random() * Math.PI * 2,
            size: gap * 0.62,
          });
        }
      }
    }

    dots = newDots;
  }

  function drawDots() {
    const width = logoBox.clientWidth;
    const height = logoBox.clientHeight;
    const time = performance.now() * 0.0024;

    ctx.clearRect(0, 0, width, height);
    ctx.fillStyle = logoColor;

    for (let i = 0; i < dots.length; i += 1) {
      const dot = dots[i];
      const dx = dot.x - mouse.x;
      const dy = dot.y - mouse.y;
      const distance = Math.hypot(dx, dy);

      if (mouse.inside && distance < mouse.radius) {
        const force = (mouse.radius - distance) / mouse.radius;
        const angle = Math.atan2(dy, dx);
        const radialPush = (0.3 + distance / mouse.radius) * force * 1.15;
        const swirlPush = force * 1.95;

        dot.vx += Math.cos(angle) * radialPush;
        dot.vy += Math.sin(angle) * radialPush;
        dot.vx += Math.cos(dot.seed + time + dot.homeY * 0.018) * swirlPush;
        dot.vy += Math.sin(dot.seed + time * 1.1 + dot.homeX * 0.018) * swirlPush;
      }

      dot.vx += (dot.homeX - dot.x) * 0.028;
      dot.vy += (dot.homeY - dot.y) * 0.028;

      dot.vx *= 0.88;
      dot.vy *= 0.88;

      dot.x += dot.vx;
      dot.y += dot.vy;

      ctx.beginPath();
      ctx.arc(dot.x, dot.y, dot.size, 0, Math.PI * 2);
      ctx.fill();
    }

    animationFrame = requestAnimationFrame(drawDots);
  }

  function updateMousePosition(event) {
    const rect = logoCanvas.getBoundingClientRect();

    mouse.x = event.clientX - rect.left;
    mouse.y = event.clientY - rect.top;
    mouse.inside = true;
  }

  function resetMousePosition() {
    mouse.x = -9999;
    mouse.y = -9999;
    mouse.inside = false;
  }

  function redrawLogo() {
    setCanvasSize();
    buildDots();

    cancelAnimationFrame(animationFrame);
    drawDots();
  }

  logoCanvas.addEventListener("mousemove", updateMousePosition);
  logoCanvas.addEventListener("mouseenter", updateMousePosition);
  logoCanvas.addEventListener("mouseleave", resetMousePosition);

  window.addEventListener("resize", () => {
    clearTimeout(resizeTimer);
    resizeTimer = window.setTimeout(redrawLogo, 120);
  });

  if (document.fonts && document.fonts.load) {
    document.fonts.load('200px "logo_font"').then(redrawLogo);
  } else {
    redrawLogo();
  }
}

// screen2: climate
function startClimate() {
  const section = document.getElementById("screen2");
  const climateCanvas = document.getElementById("screen2_canvas");
  const humiditySlider = document.getElementById("humidity_slider");
  const temperatureSlider = document.getElementById("temperature_slider");
  const leftGlow = section ? section.querySelector(".screen2__glow.glow_left") : null;
  const rightGlow = section ? section.querySelector(".screen2__glow.glow_right") : null;
  const leftRings = section ? section.querySelector(".screen2__rings.rings_left") : null;
  const rightRings = section ? section.querySelector(".screen2__rings.rings_right") : null;

  if (!section || !climateCanvas || !humiditySlider || !temperatureSlider) {
    return;
  }

  const ctx = climateCanvas.getContext("2d");

  if (!ctx) {
    return;
  }

  const coldColor = { r: 75, g: 222, b: 219 };
  const centerColor = { r: 73, g: 144, b: 62 };
  const warmColor = { r: 245, g: 124, b: 17 };

  function setCanvasSize() {
    climateCanvas.width = climateCanvas.clientWidth;
    climateCanvas.height = climateCanvas.clientHeight;
  }

  function updateSliderBackground(range, value, activeColor) {
    range.style.setProperty("--active-percent", value + "%");
    range.style.setProperty("--thumb-color", activeColor);
  }

  function updateDecor(tempColor, humidityColor) {
    const tempString = colorText(tempColor, 1);
    const humidityString = colorText(humidityColor, 1);

    section.style.setProperty("--temp-color", tempString);
    section.style.setProperty("--humidity-color", humidityString);

    if (leftGlow) {
      leftGlow.style.background =
        "radial-gradient(circle, " +
        colorText(tempColor, 0.72) +
        " 0%, " +
        colorText(tempColor, 0.28) +
        " 36%, rgba(255,255,255,0) 74%)";
    }

    if (rightGlow) {
      rightGlow.style.background =
        "radial-gradient(circle, " +
        colorText(tempColor, 0.72) +
        " 0%, " +
        colorText(tempColor, 0.28) +
        " 36%, rgba(255,255,255,0) 74%)";
    }

    if (leftRings) {
      leftRings.style.background =
        "repeating-radial-gradient(circle, transparent 0 28px, " +
        colorText(humidityColor, 0.46) +
        " 28px 32px)";
    }

    if (rightRings) {
      rightRings.style.background =
        "repeating-radial-gradient(circle, transparent 0 28px, " +
        colorText(humidityColor, 0.46) +
        " 28px 32px)";
    }
  }

  function drawBranch(startX, startY, length, angle, depth, maxDepth, config, color) {
    if (depth === 0 || length < 10) {
      return;
    }

    const endX = startX + Math.cos(angle) * length;
    const endY = startY + Math.sin(angle) * length;

    ctx.strokeStyle = color;
    ctx.lineWidth = Math.max(1.7, depth * 1.32);
    ctx.lineCap = "round";
    ctx.beginPath();
    ctx.moveTo(startX, startY);
    ctx.lineTo(endX, endY);
    ctx.stroke();

    const nextLength = length * config.lengthScale;
    const split = config.baseSplit + (maxDepth - depth) * config.splitGrow;

    drawBranch(endX, endY, nextLength, angle - split, depth - 1, maxDepth, config, color);
    drawBranch(endX, endY, nextLength, angle + split, depth - 1, maxDepth, config, color);

    if (config.centerBranch && depth >= config.centerBranchDepth) {
      drawBranch(
        endX,
        endY,
        nextLength * config.centerBranchScale,
        angle,
        depth - config.centerBranchDepthLoss,
        maxDepth,
        config,
        color
      );
    }
  }

  function drawTree() {
    const width = climateCanvas.width;
    const height = climateCanvas.height;
    const waterValue = Number(humiditySlider.value);
    const heatValue = Number(temperatureSlider.value);

    const tempColor = getColorByValue(heatValue, coldColor, centerColor, warmColor);
    const humidityColor = getColorByValue(waterValue, warmColor, centerColor, coldColor);

    ctx.clearRect(0, 0, width, height);

    updateDecor(tempColor, humidityColor);
    updateSliderBackground(temperatureSlider, heatValue, colorText(tempColor, 1));
    updateSliderBackground(humiditySlider, waterValue, colorText(humidityColor, 1));

    const baseLength = height * (0.145 + heatValue / 560);
    const depth = 4 + Math.round((waterValue / 100) * 2);
    const humidityLevel = waterValue / 100;
    const config = {
      lengthScale: 0.63 + humidityLevel * 0.04,
      baseSplit: 0.18 + humidityLevel * 0.08,
      splitGrow: 0.006 + humidityLevel * 0.005,
      centerBranch: waterValue > 42,
      centerBranchDepth: waterValue > 72 ? 2 : 3,
      centerBranchDepthLoss: waterValue > 70 ? 1 : 2,
      centerBranchScale: 0.38 + humidityLevel * 0.14,
    };

    drawBranch(
      width / 2,
      height * 0.985,
      baseLength,
      -Math.PI / 2,
      depth,
      depth,
      config,
      colorText(tempColor, 0.98)
    );
  }

  function updateClimate() {
    const waterValue = Number(humiditySlider.value);
    const heatValue = Number(temperatureSlider.value);

    section.style.setProperty("--temp-fill", heatValue + "%");
    section.style.setProperty("--humidity-fill", waterValue + "%");
    drawTree();
  }

  function onResize() {
    setCanvasSize();
    updateClimate();
  }

  humiditySlider.addEventListener("input", updateClimate);
  temperatureSlider.addEventListener("input", updateClimate);
  window.addEventListener("resize", onResize);

  onResize();
}

// screen3: plant cards
function startCards() {
  const plantsArea = document.getElementById("screen3_plants");
  const plantItems = plantsArea ? Array.from(plantsArea.querySelectorAll(".plant")) : [];

  if (!plantsArea || plantItems.length === 0) {
    return;
  }

  function hideCards() {
    plantsArea.classList.remove("has-active");
    plantItems.forEach((plantItem) => {
      plantItem.classList.remove("is-active");
    });
  }

  function showCard(plantItem) {
    plantsArea.classList.add("has-active");
    plantItems.forEach((item) => {
      item.classList.toggle("is-active", item === plantItem);
    });
  }

  plantItems.forEach((plantItem) => {
    plantItem.addEventListener("click", (event) => {
      event.stopPropagation();

      if (plantItem.classList.contains("is-active")) {
        hideCards();
        return;
      }

      showCard(plantItem);
    });

    plantItem.addEventListener("keydown", (event) => {
      if (event.key === "Enter" || event.key === " ") {
        event.preventDefault();
        plantItem.click();
      }
    });
  });

  document.addEventListener("click", (event) => {
    if (!(event.target instanceof Element) || !event.target.closest(".plant")) {
      hideCards();
    }
  });

  document.addEventListener("keydown", (event) => {
    if (event.key === "Escape") {
      hideCards();
    }
  });
}

// screen4: build plant
function startBuildPlant() {
  const section = document.getElementById("screen4");
  const dropZone = document.getElementById("screen4_drop_zone");
  const previewArea = document.getElementById("screen4_preview");
  const plantBox = document.getElementById("screen4_plant_box");
  const resetButton = document.getElementById("screen4_reset");
  const toolButtons = section ? Array.from(section.querySelectorAll(".element")) : [];

  if (!section || !dropZone || !previewArea || !plantBox || !resetButton || toolButtons.length === 0) {
    return;
  }

  const dropSlots = [
    { left: "30%", top: "28%", size: 58 },
    { left: "56%", top: "24%", size: 62 },
    { left: "72%", top: "47%", size: 56 },
    { left: "57%", top: "70%", size: 60 },
    { left: "30%", top: "68%", size: 58 },
    { left: "16%", top: "47%", size: 56 },
  ];

  const placedButtons = new Set();
  let dragState = null;

  function checkBuildState() {
    const hasProgress = placedButtons.size > 0;

    section.classList.toggle("screen4--active", hasProgress);
  }

  function clearDrag() {
    if (!dragState) {
      return;
    }

    if (dragState.ghost && dragState.ghost.parentNode) {
      dragState.ghost.parentNode.removeChild(dragState.ghost);
    }

    dropZone.classList.remove("is-hovered");
    window.removeEventListener("pointermove", onPointerMove);
    window.removeEventListener("pointerup", onPointerUp);
    window.removeEventListener("pointercancel", onPointerUp);
    dragState = null;
  }

  function resetBuild() {
    clearDrag();
    placedButtons.clear();
    previewArea.innerHTML = "";
    section.classList.remove("screen4--active");
    section.classList.remove("screen4--grown");
    plantBox.classList.remove("screen4__plant_box--show");

    toolButtons.forEach((toolButton) => {
      toolButton.classList.remove("is-placed");
    });
  }

  function showReadyPlant() {
    section.classList.add("screen4--grown");
    plantBox.classList.remove("screen4__plant_box--show");
    void plantBox.offsetWidth;
    plantBox.classList.add("screen4__plant_box--show");
  }

  function addPreview(dragItem) {
    const slot = dropSlots[Math.min(placedButtons.size, dropSlots.length - 1)];
    const icon = dragItem.querySelector("img");

    if (!icon) {
      return;
    }

    const item = document.createElement("div");
    const itemImage = icon.cloneNode(true);

    item.className = "screen4__preview_item";
    item.style.left = slot.left;
    item.style.top = slot.top;
    item.style.width = slot.size + "px";

    item.appendChild(itemImage);
    previewArea.appendChild(item);
  }

  function putItem(dragItem) {
    if (placedButtons.has(dragItem)) {
      return;
    }

    addPreview(dragItem);
    placedButtons.add(dragItem);
    dragItem.classList.add("is-placed");
    checkBuildState();

    if (placedButtons.size === toolButtons.length) {
      showReadyPlant();
    }
  }

  function isInDropCircle(clientX, clientY) {
    const rect = dropZone.getBoundingClientRect();
    const centerX = rect.left + rect.width / 2;
    const centerY = rect.top + rect.height / 2;
    const distance = Math.hypot(clientX - centerX, clientY - centerY);

    return distance <= rect.width * 0.42;
  }

  function onPointerMove(event) {
    if (!dragState) {
      return;
    }

    dragState.ghost.style.transform =
      "translate(" + (event.clientX - 58) + "px, " + (event.clientY - 58) + "px)";

    dropZone.classList.toggle("is-hovered", isInDropCircle(event.clientX, event.clientY));
  }

  function onPointerUp(event) {
    if (!dragState) {
      return;
    }

    if (isInDropCircle(event.clientX, event.clientY)) {
      putItem(dragState.tool);
    }

    clearDrag();
  }

  function onPointerDown(event) {
    if (event.pointerType === "mouse" && event.button !== 0) {
      return;
    }

    const tool = event.currentTarget;

    if (placedButtons.has(tool)) {
      return;
    }

    event.preventDefault();
    clearDrag();

    const icon = tool.querySelector("img");

    if (!icon) {
      return;
    }

    const ghost = document.createElement("div");
    const ghostImage = icon.cloneNode(true);

    ghost.className = "element_drag";
    ghost.appendChild(ghostImage);
    document.body.appendChild(ghost);

    dragState = {
      tool,
      ghost,
    };

    onPointerMove(event);

    window.addEventListener("pointermove", onPointerMove);
    window.addEventListener("pointerup", onPointerUp);
    window.addEventListener("pointercancel", onPointerUp);
  }

  toolButtons.forEach((toolButton) => {
    toolButton.addEventListener("pointerdown", onPointerDown);
  });

  resetButton.addEventListener("click", resetBuild);
}

// screen5: grow random flower
function startGrowFlowers() {
  const field = document.getElementById("screen5_ground");
  const flowersLayer = document.getElementById("screen5_flowers");

  if (!field || !flowersLayer) {
    return;
  }

  const plants = [
    "assets/screen5/download (37) 1.svg",
    "assets/screen5/download (38) 1.svg",
    "assets/screen5/download (46) 1.svg",
    "assets/screen5/download (40) 1.svg",
    "assets/screen5/download (47) 1.svg",
    "assets/screen5/download (41) 1.svg",
    "assets/screen5/download (44) 1.svg",
  ];
  const preloadedPlants = new Map();

  const maxPlants = 14;
  const growTime = 1550;

  function clamp(value, min, max) {
    return Math.max(min, Math.min(max, value));
  }

  function getRandomPlant() {
    const index = Math.floor(Math.random() * plants.length);
    return plants[index];
  }

  function preloadPlants() {
    plants.forEach((plantPath) => {
      const img = new Image();
      img.src = plantPath;
      preloadedPlants.set(plantPath, img);
    });
  }

  function waitImage(image, imagePath) {
    return new Promise((resolve) => {
      function finish() {
        resolve();
      }

      image.addEventListener("load", finish, { once: true });
      image.addEventListener("error", finish, { once: true });
      image.src = imagePath;

      if (image.complete) {
        finish();
      }
    });
  }

  function removeFirstFlower() {
    const oldPlant = flowersLayer.firstElementChild;

    if (!oldPlant) {
      return;
    }

    oldPlant.classList.add("is-removing");
    window.setTimeout(() => {
      if (oldPlant.parentNode) {
        oldPlant.parentNode.removeChild(oldPlant);
      }
    }, 380);
  }

  async function growFlower(event) {
    const rect = field.getBoundingClientRect();
    const stage = flowersLayer.getBoundingClientRect();
    const clickX = event.clientX - rect.left;
    const clickY = event.clientY - rect.top;

    if (clickX < 0 || clickY < 0 || clickX > rect.width || clickY > rect.height) {
      return;
    }

    const rootX = clamp(event.clientX - stage.left, 18, stage.width - 18);
    const rootBottom = event.clientY <= stage.bottom
      ? stage.bottom - event.clientY
      : -(event.clientY - stage.bottom);
    const bottom = clamp(rootBottom, -stage.height * 0.18, stage.height * 0.68);
    const widthBase = stage.width * 0.118;
    const width = clamp(widthBase * (0.82 + Math.random() * 0.42), 88, 210);
    const rotate = (Math.random() - 0.5) * 6;

    const plant = document.createElement("article");
    const image = document.createElement("img");
    const imagePath = getRandomPlant();
    const cachedImage = preloadedPlants.get(imagePath);

    plant.className = "screen5__flower";
    plant.style.left = rootX + "px";
    plant.style.bottom = bottom + "px";
    plant.style.width = width + "px";
    plant.style.setProperty("--plant-rotate", rotate.toFixed(2) + "deg");

    image.alt = "Новый цветок";
    image.draggable = false;
    plant.appendChild(image);

    if (cachedImage && cachedImage.complete) {
      image.src = imagePath;
    } else {
      await waitImage(image, imagePath);
    }

    const imageWidth = image.naturalWidth || (cachedImage ? cachedImage.naturalWidth : 0) || 260;
    const imageHeight = image.naturalHeight || (cachedImage ? cachedImage.naturalHeight : 0) || 385;
    const plantHeight = clamp(width * (imageHeight / imageWidth), 130, stage.height * 0.62);

    plant.style.setProperty("--plant-height", plantHeight + "px");
    plant.style.height = "0px";

    flowersLayer.appendChild(plant);

    requestAnimationFrame(() => {
      requestAnimationFrame(() => {
        plant.style.height = plantHeight + "px";
        plant.classList.add("is-visible");

        window.setTimeout(() => {
          if (plant.parentNode && !plant.classList.contains("is-removing")) {
            plant.classList.add("is-resting");
          }
        }, growTime);
      });
    });

    if (flowersLayer.children.length > maxPlants) {
      removeFirstFlower();
    }
  }

  preloadPlants();
  field.addEventListener("click", growFlower);
}

function startCursor() {
  if (!window.matchMedia("(pointer: fine)").matches) {
    return;
  }

  const canvas = document.getElementById("cursor_swarm");

  if (!(canvas instanceof HTMLCanvasElement)) {
    return;
  }

  const ctx = canvas.getContext("2d");

  if (!ctx) {
    return;
  }

  let mouse = {
    x: window.innerWidth / 2,
    y: window.innerHeight / 2,
  };
  let trail = [];
  let dust = [];
  let isVisible = false;
  let isHover = false;
  let frame = 0;

  function makeCursor() {
    const ratio = window.devicePixelRatio || 1;

    canvas.width = window.innerWidth * ratio;
    canvas.height = window.innerHeight * ratio;
    canvas.style.width = window.innerWidth + "px";
    canvas.style.height = window.innerHeight + "px";
    ctx.setTransform(ratio, 0, 0, ratio, 0, 0);

    trail = Array.from({ length: 10 }, (_, index) => ({
      x: mouse.x,
      y: mouse.y,
      size: 4.8 - index * 0.2,
    }));

    dust = Array.from({ length: 18 }, () => ({
      angle: Math.random() * Math.PI * 2,
      radius: 8 + Math.random() * 14,
      speed: 0.002 + Math.random() * 0.004,
      offset: Math.random() * Math.PI * 2,
    }));
  }

  function drawLine() {
    for (let i = 1; i < trail.length; i += 1) {
      const first = trail[i - 1];
      const second = trail[i];
      const alpha = 0.4 - (i / trail.length) * 0.28;

      ctx.strokeStyle = "rgba(83, 158, 102, " + alpha + ")";
      ctx.lineWidth = Math.max(0.7, 2.2 - i * 0.05);
      ctx.beginPath();
      ctx.moveTo(first.x, first.y);
      ctx.lineTo(second.x, second.y);
      ctx.stroke();
    }
  }

  function drawDots() {
    trail.forEach((point, index) => {
      const alpha = 0.64 - (index / trail.length) * 0.5;
      const size = Math.max(1.2, point.size);

      ctx.fillStyle = "rgba(93, 168, 111, " + alpha + ")";
      ctx.beginPath();
      ctx.arc(point.x, point.y, size, 0, Math.PI * 2);
      ctx.fill();
    });
  }

  function drawDust() {
    dust.forEach((dot) => {
      dot.angle += dot.speed * (isHover ? 1.8 : 1);

      const x = mouse.x + Math.cos(dot.angle + dot.offset) * dot.radius;
      const y = mouse.y + Math.sin(dot.angle) * dot.radius * 0.72;
      const alpha = (isHover ? 0.3 : 0.18) + Math.sin(dot.angle * 2) * 0.06;
      const size = isHover ? 1.2 : 0.9;

      ctx.fillStyle = "rgba(152, 195, 126, " + alpha + ")";
      ctx.beginPath();
      ctx.arc(x, y, size, 0, Math.PI * 2);
      ctx.fill();
    });
  }

  function drawCore() {
    ctx.fillStyle = isHover ? "rgba(73, 144, 62, 0.88)" : "rgba(73, 144, 62, 0.72)";
    ctx.beginPath();
    ctx.arc(mouse.x, mouse.y, isHover ? 3.2 : 2.6, 0, Math.PI * 2);
    ctx.fill();
  }

  function animate() {
    ctx.clearRect(0, 0, window.innerWidth, window.innerHeight);

    if (!isVisible) {
      frame = requestAnimationFrame(animate);
      return;
    }

    trail.forEach((point, index) => {
      const target = index === 0 ? mouse : trail[index - 1];
      const ease = index === 0 ? 0.52 : 0.46;

      point.x += (target.x - point.x) * ease;
      point.y += (target.y - point.y) * ease;
    });

    drawLine();
    drawDots();
    drawDust();
    drawCore();

    frame = requestAnimationFrame(animate);
  }

  function showCursor() {
    isVisible = true;
    canvas.style.opacity = "1";
  }

  function hideCursor() {
    isVisible = false;
    canvas.style.opacity = "0";
  }

  function moveCursor(event) {
    mouse.x = event.clientX;
    mouse.y = event.clientY;
    showCursor();
  }

  document.addEventListener("mousemove", moveCursor, { passive: true });
  document.addEventListener("mouseenter", showCursor, { passive: true });
  document.addEventListener("mouseleave", hideCursor, { passive: true });
  window.addEventListener("blur", hideCursor);

  document.addEventListener("mouseover", (event) => {
    if (event.target instanceof Element && event.target.closest("a, button, input, canvas, .element, .plant")) {
      isHover = true;
    }
  });

  document.addEventListener("mouseout", (event) => {
    if (event.target instanceof Element && event.target.closest("a, button, input, canvas, .element, .plant")) {
      isHover = false;
    }
  });

  window.addEventListener("resize", makeCursor);

  makeCursor();
  frame = requestAnimationFrame(animate);

  window.addEventListener("beforeunload", () => {
    cancelAnimationFrame(frame);
  });
}

startLogo();
startClimate();
startCards();
startBuildPlant();
startGrowFlowers();
startCursor();
