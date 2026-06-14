# Image Overlay

[![License: GPL v3](https://img.shields.io/badge/License-GPLv3-blue.svg)](https://www.gnu.org/licenses/gpl-3.0)

A sleek, lightweight, and transparent image overlay reference tool built with **Tauri** and **Vanilla HTML/CSS/JS**. 

This application allows artists, designers, 3D modelers, and developers to overlay reference images (PNG, JPG, SVG, WebP) on top of their workspace. Once you position the image, you can lock it to enable click-through, allowing you to paint, model, code, or design underneath it without interruption.

---

## 🌟 Features

* **Transparent & Frameless Window**: Perfectly floats on top of all other windows.
* **Drag & Drop**: Easily drop any image file to load it instantly.
* **Image Adjustments**:
  * **Opacity** (10% - 100%)
  * **Scale** (10% - 500%)
  * **Rotation** (-180° to 180°)
  * **Flip** (Horizontal & Vertical)
  * **Color Filters** (Invert colors & Grayscale)
* **Lock & Click-Through**: Lock the overlay in place and ignore all mouse clicks, allowing you to click/work on windows behind it.
* **Fine-Tuning Controls**: Nudge the image pixel-by-pixel using Arrow keys and zoom with the mouse wheel.
* **Collapsible UI Panel**: Collapse the control panel into a floating bubble to maximize screen real estate.
* **Custom Window Resizing**: Resize the borderless window from any edge or corner.

---

## ⌨️ Controls & Shortcuts

| Action | Trigger | Description |
|:---|:---|:---|
| **Lock / Unlock Window** | `Ctrl` + `Alt` + `L` *(Global)* | Toggle click-through mode |
| **Move Image** | `Click & Drag image` | Pan the reference image |
| **Zoom Image** | `Scroll wheel` | Scroll wheel over canvas |
| **Nudge Image (1px)** | `Arrow Keys` | Move image by 1 pixel |
| **Nudge Image (10px)** | `Shift` + `Arrow Keys` | Move image by 10 pixels |
| **Move Window** | `Drag Header / Background` | Move the window (when unlocked) |
| **Resize Window** | `Drag Borders / Corners` | Resize window (when unlocked) |

---

## 🛠️ Development & Building

### Prerequisites
Ensure you have the following installed:
1. **Node.js** (v18+)
2. **Rust & Cargo** (for Tauri backend compilation)

### Steps

1. **Clone the repository:**
   ```bash
   git clone https://github.com/minaby/img-overlay.git
   cd img-overlay
   ```

2. **Install frontend dependencies:**
   ```bash
   npm install
   ```

3. **Run in development mode:**
   ```bash
   npm run tauri dev
   ```

4. **Build the production installer:**
   ```bash
   npm run tauri build
   ```
   * The installer (`.msi` / `.exe` setup) will be generated in `src-tauri/target/release/bundle/`.

---

## 🧹 Maintenance Tip
Rust builds can generate a large amount of cache files inside the `src-tauri/target/` directory (sometimes up to several gigabytes). 

* To clean all build cache and release disk space, run inside `src-tauri`:
  ```bash
  cargo clean
  ```
* To clean only development caches while keeping the built `.exe`/`.msi` files, delete only the `src-tauri/target/debug` directory:
  ```powershell
  Remove-Item -Recurse -Force src-tauri/target/debug
  ```

---

## 📄 License

This project is licensed under the **GNU General Public License v3.0 (GPLv3)**. See the [LICENSE](LICENSE) file for details.
