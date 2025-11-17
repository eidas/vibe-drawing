# Vibe Drawing

A lightweight React + Canvas playground for sketching with brushes, shapes, fills, and quick PNG exports.

## Getting started
1. Install dependencies:
   ```bash
   npm install
   ```
2. Start the dev server:
   ```bash
   npm run dev
   ```
3. Build for production:
   ```bash
   npm run build
   ```

> If you are running in a restricted environment without registry access, install steps may need a proxy or a pre-downloaded `node_modules` directory.

## Controls
- **Brush / Pen:** Freehand drawing that follows your cursor. Adjust stroke width and color.
- **Eraser:** Removes strokes using the current thickness slider.
- **Rectangle / Circle:** Click and drag to draw shapes. Enable **Fill shapes** to paint the interior; disable to outline with the chosen color.
- **Fill:** Flood-fills the entire canvas with the selected color.
- **Color picker:** Choose any color for drawing, filling, or shapes.
- **Stroke slider:** Set stroke width between 1–48px.
- **Undo / Redo:** Step backward or forward through your drawing history.
- **Clear:** Reset the canvas to a blank white board.

## Exporting
1. Finish your artwork in the canvas.
2. Click **Export PNG** to download a `vibe-drawing.png` of the current canvas (uses `canvas.toDataURL`).
3. Share or open the PNG as desired.

## Project structure
```
└─ src/
   ├─ components/CanvasBoard.tsx  // Main drawing surface and controls
   ├─ App.tsx                      // Shell layout
   ├─ main.tsx                     // Entry point
   └─ styles.css                   // Styling
```
