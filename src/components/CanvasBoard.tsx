import type React from 'react';
import { useEffect, useRef, useState } from 'react';

type Tool = 'brush' | 'rectangle' | 'circle' | 'fill' | 'eraser';

type Point = { x: number; y: number };

const CANVAS_WIDTH = 1100;
const CANVAS_HEIGHT = 640;

function CanvasBoard() {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const [tool, setTool] = useState<Tool>('brush');
  const [color, setColor] = useState('#0f172a');
  const [strokeWidth, setStrokeWidth] = useState(8);
  const [fillShapes, setFillShapes] = useState(false);
  const [isDrawing, setIsDrawing] = useState(false);
  const [startPoint, setStartPoint] = useState<Point | null>(null);
  const [history, setHistory] = useState<string[]>([]);
  const [redoStack, setRedoStack] = useState<string[]>([]);
  const shapeSnapshot = useRef<ImageData | null>(null);
  const lastPointRef = useRef<Point | null>(null);

  const getContext = () => {
    const canvas = canvasRef.current;
    if (!canvas) return null;
    const ctx = canvas.getContext('2d');
    return ctx;
  };

  const pushHistory = () => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const next = canvas.toDataURL('image/png');
    setHistory((prev) => [...prev, next]);
  };

  const applyImage = (dataUrl: string) => {
    const ctx = getContext();
    const canvas = canvasRef.current;
    if (!ctx || !canvas) return;
    const image = new Image();
    image.src = dataUrl;
    image.onload = () => {
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      ctx.drawImage(image, 0, 0);
    };
  };

  const loadFromHistory = (stack: string[]) => {
    const last = stack[stack.length - 1];
    if (last) {
      applyImage(last);
    }
  };

  const handleUndo = () => {
    setHistory((prev) => {
      if (prev.length <= 1) return prev;
      setRedoStack((redoPrev) => [...redoPrev, prev[prev.length - 1]]);
      const nextHistory = prev.slice(0, -1);
      loadFromHistory(nextHistory);
      return nextHistory;
    });
  };

  const handleRedo = () => {
    setRedoStack((prev) => {
      if (prev.length === 0) return prev;
      const redoImage = prev[prev.length - 1];
      setHistory((historyPrev) => {
        const updatedHistory = [...historyPrev, redoImage];
        applyImage(redoImage);
        return updatedHistory;
      });
      return prev.slice(0, -1);
    });
  };

  const clearCanvas = () => {
    const ctx = getContext();
    const canvas = canvasRef.current;
    if (!ctx || !canvas) return;
    ctx.fillStyle = '#ffffff';
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    pushHistory();
    setRedoStack([]);
  };

  const exportImage = () => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const link = document.createElement('a');
    link.download = 'vibe-drawing.png';
    link.href = canvas.toDataURL('image/png');
    link.click();
  };

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    canvas.width = CANVAS_WIDTH;
    canvas.height = CANVAS_HEIGHT;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;
    ctx.lineCap = 'round';
    ctx.lineJoin = 'round';
    ctx.fillStyle = '#ffffff';
    ctx.fillRect(0, 0, CANVAS_WIDTH, CANVAS_HEIGHT);
    setHistory([canvas.toDataURL('image/png')]);
  }, []);

  const getCanvasPos = (event: React.MouseEvent<HTMLCanvasElement, MouseEvent>): Point => {
    const canvas = canvasRef.current;
    if (!canvas) return { x: 0, y: 0 };
    const rect = canvas.getBoundingClientRect();
    return {
      x: ((event.clientX - rect.left) / rect.width) * canvas.width,
      y: ((event.clientY - rect.top) / rect.height) * canvas.height,
    };
  };

  const startDrawing = (event: React.MouseEvent<HTMLCanvasElement, MouseEvent>) => {
    const ctx = getContext();
    if (!ctx) return;

    const position = getCanvasPos(event);
    setStartPoint(position);
    lastPointRef.current = position;
    setRedoStack([]);

    if (tool === 'fill') {
      ctx.fillStyle = color;
      ctx.fillRect(0, 0, CANVAS_WIDTH, CANVAS_HEIGHT);
      pushHistory();
      return;
    }

    shapeSnapshot.current = ctx.getImageData(0, 0, CANVAS_WIDTH, CANVAS_HEIGHT);
    setIsDrawing(true);

    if (tool === 'brush' || tool === 'eraser') {
      ctx.beginPath();
      ctx.moveTo(position.x, position.y);
    }
  };

  const drawLine = (ctx: CanvasRenderingContext2D, to: Point, erase = false) => {
    ctx.strokeStyle = erase ? '#ffffff' : color;
    ctx.lineWidth = strokeWidth;
    ctx.lineTo(to.x, to.y);
    ctx.stroke();
  };

  const drawRectangle = (ctx: CanvasRenderingContext2D, from: Point, to: Point) => {
    const startX = Math.min(from.x, to.x);
    const startY = Math.min(from.y, to.y);
    const width = Math.abs(to.x - from.x);
    const height = Math.abs(to.y - from.y);
    if (fillShapes) {
      ctx.fillStyle = color;
      ctx.fillRect(startX, startY, width, height);
    } else {
      ctx.strokeStyle = color;
      ctx.lineWidth = strokeWidth;
      ctx.strokeRect(startX, startY, width, height);
    }
  };

  const drawCircle = (ctx: CanvasRenderingContext2D, from: Point, to: Point) => {
    const radius = Math.hypot(to.x - from.x, to.y - from.y) / 2;
    const centerX = (from.x + to.x) / 2;
    const centerY = (from.y + to.y) / 2;
    ctx.beginPath();
    ctx.arc(centerX, centerY, radius, 0, Math.PI * 2);
    if (fillShapes) {
      ctx.fillStyle = color;
      ctx.fill();
    } else {
      ctx.strokeStyle = color;
      ctx.lineWidth = strokeWidth;
      ctx.stroke();
    }
  };

  const drawPreviewShape = (event: React.MouseEvent<HTMLCanvasElement, MouseEvent>) => {
    const ctx = getContext();
    const canvas = canvasRef.current;
    if (!ctx || !canvas || !startPoint || !shapeSnapshot.current) return;

    ctx.putImageData(shapeSnapshot.current, 0, 0);
    const current = getCanvasPos(event);

    if (tool === 'rectangle') {
      drawRectangle(ctx, startPoint, current);
    } else if (tool === 'circle') {
      drawCircle(ctx, startPoint, current);
    }
  };

  const continueDrawing = (event: React.MouseEvent<HTMLCanvasElement, MouseEvent>) => {
    if (!isDrawing) return;
    const ctx = getContext();
    if (!ctx) return;

    if (tool === 'brush') {
      const point = getCanvasPos(event);
      lastPointRef.current = point;
      drawLine(ctx, point, false);
    } else if (tool === 'eraser') {
      const point = getCanvasPos(event);
      lastPointRef.current = point;
      drawLine(ctx, point, true);
    } else {
      drawPreviewShape(event);
      lastPointRef.current = getCanvasPos(event);
    }
  };

  const stopDrawing = () => {
    if (!isDrawing) return;
    const ctx = getContext();
    if (!ctx || !startPoint) return;

    setIsDrawing(false);

    if (tool === 'rectangle' || tool === 'circle') {
      const snapshot = shapeSnapshot.current;
      if (!snapshot) return;
      ctx.putImageData(snapshot, 0, 0);
      const endPoint = lastPointRef.current ?? startPoint;
      if (tool === 'rectangle') {
        drawRectangle(ctx, startPoint, endPoint);
      } else if (tool === 'circle') {
        drawCircle(ctx, startPoint, endPoint);
      }
    }

    pushHistory();
  };

  const handleMouseUp = (event: React.MouseEvent<HTMLCanvasElement, MouseEvent>) => {
    lastPointRef.current = getCanvasPos(event);
    stopDrawing();
  };

  const handleMouseLeave = () => {
    stopDrawing();
  };

  const isActive = (value: Tool) => (tool === value ? 'active' : '');

  return (
    <section className="canvas-wrapper">
      <div className="toolbar">
        <section className="actions">
          <button className={isActive('brush')} onClick={() => setTool('brush')}>
            Brush
          </button>
          <button className={isActive('eraser')} onClick={() => setTool('eraser')}>
            Eraser
          </button>
          <button className={isActive('rectangle')} onClick={() => setTool('rectangle')}>
            Rectangle
          </button>
          <button className={isActive('circle')} onClick={() => setTool('circle')}>
            Circle
          </button>
          <button className={isActive('fill')} onClick={() => setTool('fill')}>
            Fill
          </button>
        </section>

        <section className="control-group">
          <label>
            Color
            <input type="color" value={color} onChange={(e) => setColor(e.target.value)} aria-label="Color picker" />
          </label>
        </section>

        <section className="control-group">
          <label>
            Stroke
            <input
              type="range"
              min={1}
              max={48}
              value={strokeWidth}
              onChange={(e) => setStrokeWidth(Number(e.target.value))}
            />
          </label>
          <span>{strokeWidth}px</span>
        </section>

        <section className="control-group">
          <label>
            <input type="checkbox" checked={fillShapes} onChange={(e) => setFillShapes(e.target.checked)} />
            Fill shapes
          </label>
        </section>

        <section className="actions">
          <button onClick={handleUndo} disabled={history.length <= 1}>
            Undo
          </button>
          <button onClick={handleRedo} disabled={redoStack.length === 0}>
            Redo
          </button>
          <button onClick={clearCanvas}>Clear</button>
          <button onClick={exportImage}>Export PNG</button>
        </section>
      </div>

      <div className="canvas-area">
        <canvas
          ref={canvasRef}
          onMouseDown={startDrawing}
          onMouseMove={continueDrawing}
          onMouseUp={handleMouseUp}
          onMouseLeave={handleMouseLeave}
        />
      </div>
      <p className="note">Tip: choose a tool, drag on the canvas to draw shapes or paint freehand, and export your finished artwork.</p>
    </section>
  );
}

export default CanvasBoard;
