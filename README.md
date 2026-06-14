# Image Overlay

[![License: GPL v3](https://img.shields.io/badge/License-GPLv3-blue.svg)](https://www.gnu.org/licenses/gpl-3.0)

A sleek, lightweight, and transparent image overlay reference tool built with **Tauri** and **Vanilla HTML/CSS/JS**. 

This application allows artists, designers, 3D modelers, and developers to overlay reference images (PNG, JPG, SVG, WebP) on top of their workspace. Once you position the image, you can lock it to enable click-through, allowing you to paint, model, code, or design underneath it without interruption.

---

## 🌟 Features / Tính năng nổi bật

* **Transparent & Frameless Window**: Perfectly floats on top of all other windows.
  * *Cửa sổ trong suốt & Không viền*: Luôn nổi lên trên các ứng dụng khác.
* **Drag & Drop**: Easily drop any image file to load it instantly.
  * *Kéo & Thả*: Dễ dàng kéo thả ảnh (PNG, JPG, SVG, WebP) trực tiếp vào ứng dụng để hiển thị.
* **Image Adjustments**:
  * **Opacity** (10% - 100%) / *Độ mờ đục*.
  * **Scale** (10% - 500%) / *Phóng to / Thu nhỏ*.
  * **Rotation** (-180° to 180°) / *Xoay hình*.
  * **Flip** (Horizontal & Vertical) / *Lật ảnh ngang / dọc*.
  * **Color Filters** (Invert colors & Grayscale) / *Bộ lọc màu (Đảo ngược màu & Ảnh trắng đen)*.
* **Lock & Click-Through**: Lock the overlay in place and ignore all mouse clicks, allowing you to click/work on windows behind it.
  * *Khóa & Xuyên thấu click*: Khóa cố định ảnh và bật chế độ bỏ qua click chuột, giúp bạn có thể click và thao tác trực tiếp với các phần mềm bên dưới (Photoshop, Blender, VS Code, Figma, v.v.).
* **Fine-Tuning Controls**: Nudge the image pixel-by-pixel using Arrow keys and zoom with the mouse wheel.
  * *Điều khiển chính xác*: Di chuyển ảnh từng pixel bằng các phím mũi tên và phóng to/thu nhỏ nhanh bằng con lăn chuột.
* **Collapsible UI Panel**: Collapse the control panel into a floating bubble to maximize screen real estate.
  * *Giao diện thu gọn*: Thu nhỏ bảng điều khiển thành một bong bóng nổi gọn gàng.
* **Custom Window Resizing**: Resize the borderless window from any edge or corner.
  * *Thay đổi kích thước cửa sổ*: Kéo giãn cửa sổ từ các cạnh hoặc góc như cửa sổ hệ thống thông thường.

---

## ⌨️ Controls & Shortcuts / Cách điều khiển & Phím tắt

| Action / Thao tác | Trigger / Phím tắt | Description / Mô tả |
|:---|:---|:---|
| **Lock / Unlock Window** | `Ctrl` + `Alt` + `L` *(Global)* | Toggle click-through mode / Bật/Tắt chế độ click xuyên thấu |
| **Move Image** | `Click & Drag image` | Pan the reference image / Di chuyển ảnh tham chiếu |
| **Zoom Image** | `Scroll wheel` | Scroll wheel over canvas / Cuộn chuột trên vùng ảnh |
| **Nudge Image (1px)** | `Arrow Keys` | Move image by 1 pixel / Dịch chuyển ảnh 1 pixel |
| **Nudge Image (10px)** | `Shift` + `Arrow Keys` | Move image by 10 pixels / Dịch chuyển ảnh 10 pixel |
| **Move Window** | `Drag Header / Background` | Move the window (when unlocked) / Di chuyển cửa sổ khi chưa khóa |
| **Resize Window** | `Drag Borders / Corners` | Resize window (when unlocked) / Kéo giãn cửa sổ khi chưa khóa |

---

## 🛠️ Development & Building / Hướng dẫn cài đặt & Build ứng dụng

### Prerequisites / Yêu cầu hệ thống
Ensure you have the following installed / Đảm bảo bạn đã cài đặt:
1. **Node.js** (v18+)
2. **Rust & Cargo** (for Tauri backend compilation)

### Steps / Các bước thực hiện

1. **Clone the repository / Tải mã nguồn:**
   ```bash
   git clone https://github.com/minaby/img-overlay.git
   cd img-overlay
   ```

2. **Install frontend dependencies / Cài đặt thư viện:**
   ```bash
   npm install
   ```

3. **Run in development mode / Chạy chế độ phát triển:**
   ```bash
   npm run tauri dev
   ```

4. **Build the production installer / Đóng gói ứng dụng:**
   ```bash
   npm run tauri build
   ```
   * The installer (`.msi` / `.exe` setup) will be generated in `src-tauri/target/release/bundle/`.
   * *File cài đặt sẽ được tạo ra tại thư mục `src-tauri/target/release/bundle/`.*

---

## 🧹 Maintenance Tip / Lưu ý dọn dẹp bộ nhớ
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

## 📄 License / Bản quyền

This project is licensed under the **GNU General Public License v3.0 (GPLv3)**. See the [LICENSE](LICENSE) file for details.

*Dự án này được phát hành dưới giấy phép mã nguồn mở **GPLv3**. Chi tiết xem tại file [LICENSE](LICENSE).*
