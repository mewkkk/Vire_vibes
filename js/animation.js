// screen1: logo
function mixChannel(start, end, progress) {
  return Math.round(start + (end - start) * progress);
}

function mixColors(firstColor, secondColor, progress) {
  return {
    r: mixChannel(firstColor.r, secondColor.r, progress),
    g: mixChannel(firstColor.g, secondColor.g, progress),
    b: mixChannel(firstColor.b, secondColor.b, progress),
  };
}

function colorToString(color, alpha = 1) {
  return "rgba(" + color.r + ", " + color.g + ", " + color.b + ", " + alpha + ")";
}

function getThreePointColor(value, startColor, middleColor, endColor) {
  if (value <= 50) {
    return mixColors(startColor, middleColor, value / 50);
  }

  return mixColors(middleColor, endColor, (value - 50) / 50);
}

function startLogoAnimation() {
  const logoBox = document.getElementById("logo");
  const logoCanvas = document.getElementById("logo_animation");
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

  function startLogo() {
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
    resizeTimer = window.setTimeout(startLogo, 120);
  });

  if (document.fonts && document.fonts.load) {
    document.fonts.load('200px "logo_font"').then(startLogo);
  } else {
    startLogo();
  }
}

// screen2: climate
function startClimateScreen() {
  const section = document.getElementById("screen2");
  const plantCanvas = document.getElementById("plant_canvas");
  const waterSlider = document.getElementById("water_slider");
  const heatSlider = document.getElementById("heat_slider");
  const leftGlow = section ? section.querySelector(".screen2__glow--left") : null;
  const rightGlow = section ? section.querySelector(".screen2__glow--right") : null;
  const leftRings = section ? section.querySelector(".screen2__rings--left") : null;
  const rightRings = section ? section.querySelector(".screen2__rings--right") : null;

  if (!section || !plantCanvas || !waterSlider || !heatSlider) {
    return;
  }

  const ctx = plantCanvas.getContext("2d");

  if (!ctx) {
    return;
  }

  const coldColor = { r: 75, g: 222, b: 219 };
  const centerColor = { r: 73, g: 144, b: 62 };
  const warmColor = { r: 245, g: 124, b: 17 };

  function setCanvasSize() {
    plantCanvas.width = plantCanvas.clientWidth;
    plantCanvas.height = plantCanvas.clientHeight;
  }

  function updateSliderBackground(range, value, activeColor) {
    range.style.setProperty("--active-percent", value + "%");
    range.style.setProperty("--thumb-color", activeColor);
  }

  function updateDecor(tempColor, humidityColor) {
    const tempString = colorToString(tempColor, 1);
    const humidityString = colorToString(humidityColor, 1);

    section.style.setProperty("--temp-color", tempString);
    section.style.setProperty("--humidity-color", humidityString);

    if (leftGlow) {
      leftGlow.style.background =
        "radial-gradient(circle, " +
        colorToString(tempColor, 0.72) +
        " 0%, " +
        colorToString(tempColor, 0.28) +
        " 36%, rgba(255,255,255,0) 74%)";
    }

    if (rightGlow) {
      rightGlow.style.background =
        "radial-gradient(circle, " +
        colorToString(tempColor, 0.72) +
        " 0%, " +
        colorToString(tempColor, 0.28) +
        " 36%, rgba(255,255,255,0) 74%)";
    }

    if (leftRings) {
      leftRings.style.background =
        "repeating-radial-gradient(circle, transparent 0 28px, " +
        colorToString(humidityColor, 0.46) +
        " 28px 32px)";
    }

    if (rightRings) {
      rightRings.style.background =
        "repeating-radial-gradient(circle, transparent 0 28px, " +
        colorToString(humidityColor, 0.46) +
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

  function drawPlant() {
    const width = plantCanvas.width;
    const height = plantCanvas.height;
    const waterValue = Number(waterSlider.value);
    const heatValue = Number(heatSlider.value);

    const tempColor = getThreePointColor(heatValue, coldColor, centerColor, warmColor);
    const humidityColor = getThreePointColor(waterValue, warmColor, centerColor, coldColor);

    ctx.clearRect(0, 0, width, height);

    updateDecor(tempColor, humidityColor);
    updateSliderBackground(heatSlider, heatValue, colorToString(tempColor, 1));
    updateSliderBackground(waterSlider, waterValue, colorToString(humidityColor, 1));

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
      colorToString(tempColor, 0.98)
    );
  }

  function updateScreen2() {
    const waterValue = Number(waterSlider.value);
    const heatValue = Number(heatSlider.value);

    section.style.setProperty("--temp-fill", heatValue + "%");
    section.style.setProperty("--humidity-fill", waterValue + "%");
    drawPlant();
  }

  function onResize() {
    setCanvasSize();
    updateScreen2();
  }

  waterSlider.addEventListener("input", updateScreen2);
  heatSlider.addEventListener("input", updateScreen2);
  window.addEventListener("resize", onResize);

  onResize();
}

// screen3: plant cards
function startCatalogCards() {
  const plantsBox = document.getElementById("plants_box");
  const plantItems = plantsBox ? Array.from(plantsBox.querySelectorAll(".plant")) : [];

  if (!plantsBox || plantItems.length === 0) {
    return;
  }

  function closeCards() {
    plantsBox.classList.remove("has-active");
    plantItems.forEach((plantItem) => {
      plantItem.classList.remove("is-active");
    });
  }

  function openCard(plantItem) {
    plantsBox.classList.add("has-active");
    plantItems.forEach((item) => {
      item.classList.toggle("is-active", item === plantItem);
    });
  }

  plantItems.forEach((plantItem) => {
    plantItem.addEventListener("click", (event) => {
      event.stopPropagation();

      if (plantItem.classList.contains("is-active")) {
        closeCards();
        return;
      }

      openCard(plantItem);
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
      closeCards();
    }
  });

  document.addEventListener("keydown", (event) => {
    if (event.key === "Escape") {
      closeCards();
    }
  });
}

// screen4: build plant
function startPlantBuilder() {
  const section = document.getElementById("screen4");
  const dropCircle = document.getElementById("elements_drop");
  const previewBox = document.getElementById("elements_preview");
  const plantResult = document.getElementById("plant_result");
  const resetButton = document.getElementById("restart_button");
  const dragItems = section ? Array.from(section.querySelectorAll(".element")) : [];

  if (!section || !dropCircle || !previewBox || !plantResult || !resetButton || dragItems.length === 0) {
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

  const placedIds = new Set();
  let dragState = null;

  function updateSectionState() {
    const hasProgress = placedIds.size > 0;

    section.classList.toggle("screen4--active", hasProgress);
  }

  function clearDrag() {
    if (!dragState) {
      return;
    }

    if (dragState.ghost && dragState.ghost.parentNode) {
      dragState.ghost.parentNode.removeChild(dragState.ghost);
    }

    dropCircle.classList.remove("is-hovered");
    window.removeEventListener("pointermove", onPointerMove);
    window.removeEventListener("pointerup", onPointerUp);
    window.removeEventListener("pointercancel", onPointerUp);
    dragState = null;
  }

  function resetBuilder() {
    clearDrag();
    placedIds.clear();
    previewBox.innerHTML = "";
    section.classList.remove("screen4--active");
    section.classList.remove("screen4--grown");
    plantResult.classList.remove("plant_result--show");

    dragItems.forEach((dragItem) => {
      dragItem.classList.remove("is-placed");
    });
  }

  function showPlant() {
    section.classList.add("screen4--grown");
    plantResult.classList.remove("plant_result--show");
    void plantResult.offsetWidth;
    plantResult.classList.add("plant_result--show");
  }

  function addDropPreview(dragItem) {
    const slot = dropSlots[Math.min(placedIds.size, dropSlots.length - 1)];
    const icon = dragItem.querySelector("img");

    if (!icon) {
      return;
    }

    const item = document.createElement("div");
    const itemImage = icon.cloneNode(true);

    item.className = "element_preview";
    item.dataset.toolId = dragItem.dataset.toolId || "";
    item.style.left = slot.left;
    item.style.top = slot.top;
    item.style.width = slot.size + "px";

    item.appendChild(itemImage);
    previewBox.appendChild(item);
  }

  function dropItem(dragItem) {
    const toolId = dragItem.dataset.toolId || "";

    if (!toolId || placedIds.has(toolId)) {
      return;
    }

    addDropPreview(dragItem);
    placedIds.add(toolId);
    dragItem.classList.add("is-placed");
    updateSectionState();

    if (placedIds.size === dragItems.length) {
      showPlant();
    }
  }

  function isInsideCircle(clientX, clientY) {
    const rect = dropCircle.getBoundingClientRect();
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

    dropCircle.classList.toggle("is-hovered", isInsideCircle(event.clientX, event.clientY));
  }

  function onPointerUp(event) {
    if (!dragState) {
      return;
    }

    if (isInsideCircle(event.clientX, event.clientY)) {
      dropItem(dragState.tool);
    }

    clearDrag();
  }

  function onPointerDown(event) {
    if (event.pointerType === "mouse" && event.button !== 0) {
      return;
    }

    const tool = event.currentTarget;
    const toolId = tool.dataset.toolId || "";

    if (!toolId || placedIds.has(toolId)) {
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

  dragItems.forEach((dragItem) => {
    dragItem.addEventListener("pointerdown", onPointerDown);
  });

  resetButton.addEventListener("click", resetBuilder);
}

// screen5: grow random flower
function startScreen5Grow() {
  const section = document.getElementById("screen5");
  const field = document.getElementById("screen5_field");
  const plantsLayer = document.getElementById("screen5_plants");

  if (!section || !field || !plantsLayer) {
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

  function clamp(value, min, max) {
    return Math.max(min, Math.min(max, value));
  }

  function pickRandomPlant() {
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

  function waitForImage(image, imagePath) {
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

  function removeOldPlant() {
    const oldPlant = plantsLayer.firstElementChild;

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

  async function growPlant(event) {
    const rect = field.getBoundingClientRect();
    const clickX = event.clientX - rect.left;
    const clickY = event.clientY - rect.top;

    if (clickX < 0 || clickY < 0 || clickX > rect.width || clickY > rect.height) {
      return;
    }

    const xPercent = clamp(clickX / rect.width, 0.06, 0.94);
    const yPercent = clamp(clickY / rect.height, 0.2, 0.94);
    const bottomFromClick = (1 - yPercent) * rect.height - 12;
    const bottom = clamp(bottomFromClick, 8, rect.height * 0.55);
    const widthBase = rect.width * 0.135;
    const width = clamp(widthBase * (0.78 + Math.random() * 0.5), 92, 240);
    const rotate = (Math.random() - 0.5) * 6;

    const plant = document.createElement("article");
    const image = document.createElement("img");
    const imagePath = pickRandomPlant();
    const cachedImage = preloadedPlants.get(imagePath);

    plant.className = "screen5_plant";
    plant.style.left = xPercent * 100 + "%";
    plant.style.bottom = bottom + "px";
    plant.style.width = width + "px";
    plant.style.setProperty("--plant-rotate", rotate.toFixed(2) + "deg");

    image.alt = "Новый цветок";
    image.draggable = false;
    plant.appendChild(image);

    if (cachedImage && cachedImage.complete) {
      image.src = imagePath;
    } else {
      await waitForImage(image, imagePath);
    }

    plantsLayer.appendChild(plant);

    requestAnimationFrame(() => {
      requestAnimationFrame(() => {
        plant.classList.add("is-growing");
      });
    });

    if (plantsLayer.children.length > maxPlants) {
      removeOldPlant();
    }
  }

  preloadPlants();
  field.addEventListener("click", growPlant);
}

function startSiteCursor() {
  if (!window.matchMedia("(pointer: fine)").matches) {
    return;
  }

  const cursor = document.createElement("div");
  const dot = document.createElement("div");

  cursor.className = "site_cursor";
  dot.className = "site_cursor_dot";

  document.body.appendChild(cursor);
  document.body.appendChild(dot);

  const hoverTargets = "a, button, input, canvas, .element, .plant";
  let targetX = window.innerWidth / 2;
  let targetY = window.innerHeight / 2;
  let ringX = targetX;
  let ringY = targetY;
  let dotX = targetX;
  let dotY = targetY;
  let raf = 0;

  function tick() {
    ringX += (targetX - ringX) * 0.15;
    ringY += (targetY - ringY) * 0.15;
    dotX += (targetX - dotX) * 0.34;
    dotY += (targetY - dotY) * 0.34;

    cursor.style.transform = "translate(" + ringX + "px, " + ringY + "px) translate(-50%, -50%)";
    dot.style.transform = "translate(" + dotX + "px, " + dotY + "px) translate(-50%, -50%)";

    raf = requestAnimationFrame(tick);
  }

  function showCursor() {
    cursor.style.opacity = "1";
    dot.style.opacity = "1";
  }

  function hideCursor() {
    cursor.style.opacity = "0";
    dot.style.opacity = "0";
  }

  function moveCursor(event) {
    targetX = event.clientX;
    targetY = event.clientY;
    showCursor();
  }

  document.addEventListener("mousemove", moveCursor, { passive: true });
  document.addEventListener("mouseenter", showCursor, { passive: true });
  document.addEventListener("mouseleave", hideCursor, { passive: true });
  window.addEventListener("blur", hideCursor);

  document.addEventListener("mouseover", (event) => {
    if (event.target instanceof Element && event.target.closest(hoverTargets)) {
      cursor.classList.add("is-hover");
    }
  });

  document.addEventListener("mouseout", (event) => {
    if (event.target instanceof Element && event.target.closest(hoverTargets)) {
      cursor.classList.remove("is-hover");
    }
  });

  raf = requestAnimationFrame(tick);

  window.addEventListener("beforeunload", () => {
    cancelAnimationFrame(raf);
  });
}

startLogoAnimation();
startClimateScreen();
startCatalogCards();
startPlantBuilder();
startScreen5Grow();
startSiteCursor();
