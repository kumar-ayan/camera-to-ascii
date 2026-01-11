# 📟 Matrix Camera to ASCII

A real-time camera-to-ASCII web application with a "Cyberpunk/Matrix" aesthetic. Built with React, Vite, and TypeScript.

## ✨ Features

- **Real-time Conversion**: Converts webcam feed to ASCII art at 30-60 FPS using luminosity mapping.
- **Strict Auto-Resolution**: Automatically adjusts the grid dimensions to perfectly fill your screen based on font size.
- **Image Upload**: Switch from camera mode to upload and convert any static image.
- **Snapshot Capture**: Download high-quality PNG screenshots of your ASCII art.
- **Smart Mirroring**: Automatically mirrors the webcam feed for a natural feel, while keeping uploaded images standard.
- **Matrix Aesthetic**: Custom "green-on-black" theme with CRT scanline effects and a clean, hidden UI (press 'H' to toggle).
- **Customizable**: Adjust font size and color in real-time.

## 🚀 Getting Started

### Prerequisites

- Node.js (v14 or higher)
- npm

### Installation

1. Clone the repository:
   ```bash
   git clone https://github.com/kumar-ayan/camera-to-ascii.git
   cd camera-to-ascii
   ```

2. Install dependencies:
   ```bash
   npm install
   ```

3. Start the development server:
   ```bash
   npm run dev
   ```

4. Open your browser and navigate to the localhost URL shown in the terminal (usually `http://localhost:5173`).

## 🛠️ Built With

- **[React](https://reactjs.org/)** - UI Library
- **[Vite](https://vitejs.dev/)** - Build Tool
- **[TypeScript](https://www.typescriptlang.org/)** - Static Typing
- **Canvas API** - Image Processing

## 🎮 Controls

- **Font Size**: Slider to adjust character size (affects resolution).
- **Color**: Picker to change the matrix text color.
- **Mode**: Toggle between Standard and Complex character sets.
- **Upload Image**: Load a static image file.
- **Capture Snapshot**: Save current view as PNG.
- **'H' Key**: Toggle UI visibility.
- **Fullscreen**: Toggle browser fullscreen (F11/Native).

## 📄 License

This project is open source.
