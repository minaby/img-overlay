// Safely wrap Tauri calls to prevent top-level crashes if window.__TAURI__ is injected late
function safeInvoke(cmd, args) {
  if (window.__TAURI__ && window.__TAURI__.core) {
    return window.__TAURI__.core.invoke(cmd, args);
  }
  console.warn("Tauri invoke not available:", cmd);
  return Promise.resolve();
}

// Safely wrap Tauri event listener
function safeListen(event, callback) {
  if (window.__TAURI__ && window.__TAURI__.event) {
    return window.__TAURI__.event.listen(event, callback);
  }
  console.warn("Tauri listen not available:", event);
  return Promise.resolve(() => {});
}

// Safely retrieve current Tauri window
function getTauriWindow() {
  if (window.__TAURI__ && window.__TAURI__.window) {
    return window.__TAURI__.window.getCurrentWindow();
  }
  return null;
}

// State variables
let state = {
  x: 0,
  y: 0,
  scale: 1,      // 1.0 = 100%
  rotate: 0,     // degrees
  opacity: 0.5,  // 0.5 = 50%
  flipX: 1,      // 1 or -1
  flipY: 1,      // 1 or -1
  invert: false,
  grayscale: false,
  isLocked: false,
  isDragging: false,
  dragStartX: 0,
  dragStartY: 0,
  imageStartX: 0,
  imageStartY: 0,
  hasImage: false
};

// DOM Elements
let overlayImage;
let dropzone;
let browseBtn;
let fileInput;
let controlPanel;
let collapseBtn;
let expandBubble;
let closeBtn;
let resetImageBtn;
let removeImageBtn;
let activeImageInfo;
let imageNameEl;
let lockBtn;
let lockedOverlay;

// Sliders and Inputs
let opacitySlider, opacityNumber;
let scaleSlider, scaleNumber;
let rotateSlider, rotateNumber;

// Filter and Flip buttons
let flipHBtn, flipVBtn;
let filterInvertBtn, filterGrayscaleBtn;

// Position Centering
let centerPositionBtn;

window.addEventListener("DOMContentLoaded", () => {
  initElements();
  setupEventListeners();
  setupTauriListeners();
  resetTransforms();
});

function initElements() {
  overlayImage = document.getElementById("overlay-image");
  dropzone = document.getElementById("dropzone");
  browseBtn = document.getElementById("browse-btn");
  fileInput = document.getElementById("file-input");
  controlPanel = document.getElementById("control-panel");
  collapseBtn = document.getElementById("collapse-btn");
  expandBubble = document.getElementById("expand-bubble");
  closeBtn = document.getElementById("close-btn");
  resetImageBtn = document.getElementById("reset-image-btn");
  removeImageBtn = document.getElementById("remove-image-btn");
  activeImageInfo = document.getElementById("active-image-info");
  imageNameEl = document.getElementById("image-name");
  lockBtn = document.getElementById("lock-btn");
  lockedOverlay = document.getElementById("locked-overlay");

  opacitySlider = document.getElementById("opacity-slider");
  opacityNumber = document.getElementById("opacity-number");
  scaleSlider = document.getElementById("scale-slider");
  scaleNumber = document.getElementById("scale-number");
  rotateSlider = document.getElementById("rotate-slider");
  rotateNumber = document.getElementById("rotate-number");

  flipHBtn = document.getElementById("flip-h-btn");
  flipVBtn = document.getElementById("flip-v-btn");
  filterInvertBtn = document.getElementById("filter-invert-btn");
  filterGrayscaleBtn = document.getElementById("filter-grayscale-btn");

  centerPositionBtn = document.getElementById("center-position-btn");
}

function setupEventListeners() {
  // Programmatic Window Dragging
  const dragRegions = [
    document.querySelector('.panel-header'),
    document.querySelector('.title-group'),
    document.getElementById('drag-overlay')
  ];

  dragRegions.forEach(region => {
    if (region) {
      region.addEventListener('mousedown', async (e) => {
        if (e.buttons === 1 && !state.isLocked) {
          // Check that we are not clicking on header buttons (collapse, close, minimize)
          if (!e.target.closest('#collapse-btn') && !e.target.closest('#close-btn') && !e.target.closest('#win-minimize-btn')) {
            const appWindow = getTauriWindow();
            if (appWindow) {
              e.preventDefault();
              await appWindow.startDragging();
            }
          }
        }
      });
    }
  });

  // Programmatic Window Resizing using custom borders
  const resizeBorders = [
    { id: 'resize-top', dir: 'North' },
    { id: 'resize-bottom', dir: 'South' },
    { id: 'resize-left', dir: 'West' },
    { id: 'resize-right', dir: 'East' },
    { id: 'resize-topleft', dir: 'NorthWest' },
    { id: 'resize-topright', dir: 'NorthEast' },
    { id: 'resize-bottomleft', dir: 'SouthWest' },
    { id: 'resize-bottomright', dir: 'SouthEast' }
  ];

  resizeBorders.forEach(border => {
    const el = document.getElementById(border.id);
    if (el) {
      el.addEventListener('mousedown', async (e) => {
        if (e.buttons === 1 && !state.isLocked) {
          const appWindow = getTauriWindow();
          if (appWindow) {
            e.preventDefault();
            e.stopPropagation();
            await appWindow.startResize(border.dir);
          }
        }
      });
    }
  });

  // Close app
  closeBtn.addEventListener("click", () => {
    safeInvoke("close_app");
  });

  // Minimize app
  const winMinimizeBtn = document.getElementById("win-minimize-btn");
  if (winMinimizeBtn) {
    winMinimizeBtn.addEventListener("mousedown", (e) => e.stopPropagation());
    winMinimizeBtn.addEventListener("click", () => {
      safeInvoke("minimize_app");
    });
  }

  // Maximize/Restore app
  const winMaximizeBtn = document.getElementById("win-maximize-btn");
  if (winMaximizeBtn) {
    winMaximizeBtn.addEventListener("mousedown", (e) => e.stopPropagation());
    winMaximizeBtn.addEventListener("click", () => {
      safeInvoke("toggle_maximize");
    });
  }

  // Collapse/Expand Panel
  collapseBtn.addEventListener("click", () => {
    controlPanel.classList.add("collapsed");
    expandBubble.style.display = "flex";
  });

  expandBubble.addEventListener("click", () => {
    controlPanel.classList.remove("collapsed");
    expandBubble.style.display = "none";
  });

  // File loading
  browseBtn.addEventListener("click", () => fileInput.click());
  fileInput.addEventListener("change", (e) => {
    if (e.target.files.length > 0) {
      loadImage(e.target.files[0]);
    }
  });

  // Drag and Drop Zone
  dropzone.addEventListener("dragover", (e) => {
    e.preventDefault();
    dropzone.classList.add("dragover");
  });

  dropzone.addEventListener("dragleave", () => {
    dropzone.classList.remove("dragover");
  });

  dropzone.addEventListener("drop", (e) => {
    e.preventDefault();
    dropzone.classList.remove("dragover");
    if (e.dataTransfer.files.length > 0) {
      loadImage(e.dataTransfer.files[0]);
    }
  });

  // Also enable drag and drop anywhere on the canvas
  window.addEventListener("dragover", (e) => e.preventDefault());
  window.addEventListener("drop", (e) => {
    e.preventDefault();
    if (!state.isLocked && e.dataTransfer.files.length > 0) {
      loadImage(e.dataTransfer.files[0]);
    }
  });

  // Image manipulation inputs
  // Opacity
  opacitySlider.addEventListener("input", (e) => {
    updateOpacity(parseInt(e.target.value));
  });
  opacityNumber.addEventListener("input", (e) => {
    let val = parseInt(e.target.value);
    if (!isNaN(val)) {
      if (val >= 10 && val <= 100) {
        updateOpacity(val);
      } else if (val > 100) {
        updateOpacity(100);
        opacityNumber.value = 100;
      }
    }
  });
  opacityNumber.addEventListener("blur", () => {
    let val = clamp(parseInt(opacityNumber.value) || 50, 10, 100);
    updateOpacity(val);
  });

  // Scale
  scaleSlider.addEventListener("input", (e) => {
    updateScale(parseInt(e.target.value));
  });
  scaleNumber.addEventListener("input", (e) => {
    let val = parseInt(e.target.value);
    if (!isNaN(val)) {
      if (val >= 10 && val <= 500) {
        updateScale(val);
      } else if (val > 500) {
        updateScale(500);
        scaleNumber.value = 500;
      }
    }
  });
  scaleNumber.addEventListener("blur", () => {
    let val = clamp(parseInt(scaleNumber.value) || 100, 10, 500);
    updateScale(val);
  });

  // Rotation
  rotateSlider.addEventListener("input", (e) => {
    updateRotation(parseInt(e.target.value));
  });
  rotateNumber.addEventListener("input", (e) => {
    let val = parseInt(e.target.value);
    if (!isNaN(val)) {
      if (val >= -180 && val <= 180) {
        updateRotation(val);
      } else if (val > 180) {
        updateRotation(180);
        rotateNumber.value = 180;
      } else if (val < -180) {
        updateRotation(-180);
        rotateNumber.value = -180;
      }
    }
  });
  rotateNumber.addEventListener("blur", () => {
    let val = clamp(parseInt(rotateNumber.value) || 0, -180, 180);
    updateRotation(val);
  });

  // Flip buttons
  flipHBtn.addEventListener("click", () => {
    state.flipX = state.flipX === 1 ? -1 : 1;
    flipHBtn.classList.toggle("active", state.flipX === -1);
    applyTransforms();
  });

  flipVBtn.addEventListener("click", () => {
    state.flipY = state.flipY === 1 ? -1 : 1;
    flipVBtn.classList.toggle("active", state.flipY === -1);
    applyTransforms();
  });

  // Filters
  filterInvertBtn.addEventListener("click", () => {
    state.invert = !state.invert;
    filterInvertBtn.classList.toggle("active", state.invert);
    applyTransforms();
  });

  filterGrayscaleBtn.addEventListener("click", () => {
    state.grayscale = !state.grayscale;
    filterGrayscaleBtn.classList.toggle("active", state.grayscale);
    applyTransforms();
  });

  // Resets
  resetImageBtn.addEventListener("click", resetTransforms);
  removeImageBtn.addEventListener("click", removeImage);

  // Lock
  lockBtn.addEventListener("click", () => {
    safeInvoke("toggle_lock");
  });

  // Image Panning (Dragging)
  overlayImage.addEventListener("mousedown", (e) => {
    if (state.isLocked || !state.hasImage) return;
    e.preventDefault();
    state.isDragging = true;
    state.dragStartX = e.clientX;
    state.dragStartY = e.clientY;
    state.imageStartX = state.x;
    state.imageStartY = state.y;
  });

  window.addEventListener("mousemove", (e) => {
    if (!state.isDragging) return;
    let dx = e.clientX - state.dragStartX;
    let dy = e.clientY - state.dragStartY;
    state.x = state.imageStartX + dx;
    state.y = state.imageStartY + dy;
    applyTransforms();
  });

  window.addEventListener("mouseup", () => {
    state.isDragging = false;
  });

  // Center Position button
  if (centerPositionBtn) {
    centerPositionBtn.addEventListener("click", () => {
      state.x = 0;
      state.y = 0;
      applyTransforms();
    });
  }

  // Keyboard events (Nudging + Zoom scroll)
  window.addEventListener("keydown", (e) => {
    if (state.isLocked || !state.hasImage) return;
    
    // Nudging with arrow keys
    let amount = e.shiftKey ? 10 : 1;
    if (e.key === "ArrowUp") {
      e.preventDefault();
      nudge(0, -amount);
    } else if (e.key === "ArrowDown") {
      e.preventDefault();
      nudge(0, amount);
    } else if (e.key === "ArrowLeft") {
      e.preventDefault();
      nudge(-amount, 0);
    } else if (e.key === "ArrowRight") {
      e.preventDefault();
      nudge(amount, 0);
    }
  });

  // Zoom/Scale with mouse wheel (when hovering over canvas)
  document.getElementById("canvas-area").addEventListener("wheel", (e) => {
    if (state.isLocked || !state.hasImage) return;
    e.preventDefault();
    let change = e.deltaY < 0 ? 5 : -5;
    let currentScalePercent = Math.round(state.scale * 100);
    let targetScale = clamp(currentScalePercent + change, 10, 500);
    updateScale(targetScale);
  });
}

function setupTauriListeners() {
  // Listen to lock toggles from global shortcut or backend
  safeListen("lock-toggled", (event) => {
    let isLocked = event.payload;
    state.isLocked = isLocked;
    
    if (isLocked) {
      document.body.classList.add("locked");
      
      // Show locked overlay info briefly
      lockedOverlay.style.display = "flex";
      setTimeout(() => {
        // Fade out overlay banner smoothly
        lockedOverlay.style.transition = "opacity 0.5s ease";
        lockedOverlay.style.opacity = 0;
        setTimeout(() => {
          lockedOverlay.style.display = "none";
          lockedOverlay.style.opacity = 1; // restore for next toggle
          lockedOverlay.style.transition = "";
        }, 500);
      }, 2500);
    } else {
      document.body.classList.remove("locked");
      lockedOverlay.style.display = "none";
    }
  });
}

// Image Loader helper
function loadImage(file) {
  if (!file.type.startsWith("image/")) {
    alert("Please drop a valid image file!");
    return;
  }

  const reader = new FileReader();
  reader.onload = (e) => {
    overlayImage.src = e.target.result;
    overlayImage.style.display = "block";
    overlayImage.classList.add("loaded");
    dropzone.style.display = "none";
    activeImageInfo.style.display = "block";
    imageNameEl.textContent = file.name;
    state.hasImage = true;
    resetTransforms();
  };
  reader.readAsDataURL(file);
}

// Remove current image
function removeImage() {
  overlayImage.src = "";
  overlayImage.style.display = "none";
  overlayImage.classList.remove("loaded");
  dropzone.style.display = "flex";
  activeImageInfo.style.display = "none";
  state.hasImage = false;
  resetTransforms();
}

// Update functions
function updateOpacity(val) {
  state.opacity = val / 100;
  opacitySlider.value = val;
  opacityNumber.value = val;
  overlayImage.style.setProperty("--opacity", state.opacity);
}

// Set value and slider for Scale
function updateScale(val) {
  state.scale = val / 100;
  scaleSlider.value = val;
  scaleNumber.value = val;
  applyTransforms();
}

// Set value and slider for Rotation
function updateRotation(val) {
  state.rotate = val;
  rotateSlider.value = val;
  rotateNumber.value = val;
  applyTransforms();
}

function nudge(dx, dy) {
  state.x += dx;
  state.y += dy;
  applyTransforms();
}

function applyTransforms() {
  overlayImage.style.setProperty("--x", state.x + "px");
  overlayImage.style.setProperty("--y", state.y + "px");
  overlayImage.style.setProperty("--scale", state.scale);
  overlayImage.style.setProperty("--rotate", state.rotate + "deg");
  overlayImage.style.setProperty("--flip-x", state.flipX);
  overlayImage.style.setProperty("--flip-y", state.flipY);
  
  let filters = [];
  if (state.invert) filters.push("invert(1)");
  if (state.grayscale) filters.push("grayscale(1)");
  overlayImage.style.setProperty("--filter", filters.length > 0 ? filters.join(" ") : "none");
}

function resetTransforms() {
  state.x = 0;
  state.y = 0;
  state.scale = 1.0;
  state.rotate = 0;
  state.opacity = 0.5;
  state.flipX = 1;
  state.flipY = 1;
  state.invert = false;
  state.grayscale = false;

  updateOpacity(50);
  updateScale(100);
  updateRotation(0);

  flipHBtn.classList.remove("active");
  flipVBtn.classList.remove("active");
  filterInvertBtn.classList.remove("active");
  filterGrayscaleBtn.classList.remove("active");

  applyTransforms();
}

// Math Utility
function clamp(val, min, max) {
  return Math.min(Math.max(val, min), max);
}
