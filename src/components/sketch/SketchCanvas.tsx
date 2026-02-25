'use client';

import { useRef, useState, useCallback, useEffect, useMemo } from 'react';
import type { Point, Stroke, SketchData, SketchTool, SketchSettings, ViewState, BackgroundType } from '@/types/sketch';

interface Props {
    initialData?: SketchData;
    onChange?: (data: SketchData) => void;
    width?: number;
    height?: number;
}

const COLORS = [
    '#ffffff', '#ef4444', '#f97316', '#eab308', '#22c55e',
    '#06b6d4', '#3b82f6', '#8b5cf6', '#ec4899', '#000000'
];

const STROKE_WIDTHS = [1, 2, 4, 8, 16, 32];

const TOOLS: { tool: SketchTool; label: string; icon: string }[] = [
    { tool: 'pen', label: 'Pen', icon: 'M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z' },
    { tool: 'pencil', label: 'Pencil', icon: 'M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z' },
    { tool: 'marker', label: 'Marker', icon: 'M7 21a4 4 0 01-4-4V5a2 2 0 012-2h4a2 2 0 012 2v12a4 4 0 01-4 4zm0 0h12a2 2 0 002-2v-4a2 2 0 00-2-2h-2.343M11 7.343l1.657-1.657a2 2 0 012.828 0l2.829 2.829a2 2 0 010 2.828l-8.486 8.485M7 17h.01' },
    { tool: 'eraser', label: 'Eraser', icon: 'M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16' },
    { tool: 'line', label: 'Line', icon: 'M4 20L20 4' },
    { tool: 'rectangle', label: 'Rectangle', icon: 'M4 6a2 2 0 012-2h12a2 2 0 012 2v12a2 2 0 01-2 2H6a2 2 0 01-2-2V6z' },
    { tool: 'circle', label: 'Circle', icon: 'M12 22c5.523 0 10-4.477 10-10S17.523 2 12 2 2 6.477 2 12s4.477 10 10 10z' },
    { tool: 'arrow', label: 'Arrow', icon: 'M17 8l4 4m0 0l-4 4m4-4H3' },
];

const BACKGROUNDS: { type: BackgroundType; label: string }[] = [
    { type: 'solid', label: 'Solid' },
    { type: 'grid', label: 'Grid' },
    { type: 'dots', label: 'Dots' },
    { type: 'lines', label: 'Lines' },
];

// Catmull-Rom spline interpolation for smooth curves
function catmullRomSpline(p0: Point, p1: Point, p2: Point, p3: Point, t: number): Point {
    const t2 = t * t;
    const t3 = t2 * t;

    const x = 0.5 * (
        (2 * p1.x) +
        (-p0.x + p2.x) * t +
        (2 * p0.x - 5 * p1.x + 4 * p2.x - p3.x) * t2 +
        (-p0.x + 3 * p1.x - 3 * p2.x + p3.x) * t3
    );

    const y = 0.5 * (
        (2 * p1.y) +
        (-p0.y + p2.y) * t +
        (2 * p0.y - 5 * p1.y + 4 * p2.y - p3.y) * t2 +
        (-p0.y + 3 * p1.y - 3 * p2.y + p3.y) * t3
    );

    // Interpolate pressure
    const pressure = p1.pressure + (p2.pressure - p1.pressure) * t;

    return { x, y, pressure, tiltX: p1.tiltX, tiltY: p1.tiltY, timestamp: Date.now() };
}

// Smooth stroke points using Catmull-Rom spline
function smoothStroke(points: Point[], segments: number = 4): Point[] {
    if (points.length < 4) return points;

    const smoothed: Point[] = [points[0]];

    for (let i = 0; i < points.length - 1; i++) {
        const p0 = points[Math.max(0, i - 1)];
        const p1 = points[i];
        const p2 = points[Math.min(points.length - 1, i + 1)];
        const p3 = points[Math.min(points.length - 1, i + 2)];

        for (let j = 1; j <= segments; j++) {
            const t = j / segments;
            smoothed.push(catmullRomSpline(p0, p1, p2, p3, t));
        }
    }

    return smoothed;
}

// Calculate stroke width based on pressure and velocity
function calculateWidth(
    point: Point,
    prevPoint: Point | null,
    baseWidth: number,
    sensitivity: number,
    tool: SketchTool
): number {
    let width = baseWidth;

    // Pressure sensitivity
    if (sensitivity > 0) {
        const pressureFactor = 0.3 + (point.pressure * 0.7 * sensitivity);
        width *= pressureFactor;
    }

    // Tool-specific modifiers
    switch (tool) {
        case 'pencil':
            width *= 0.6;
            break;
        case 'marker':
            width *= 2.5;
            break;
        case 'eraser':
            width *= 2;
            break;
    }

    // Velocity-based thinning (for more natural strokes)
    if (prevPoint) {
        const dx = point.x - prevPoint.x;
        const dy = point.y - prevPoint.y;
        const dt = Math.max(1, point.timestamp - prevPoint.timestamp);
        const velocity = Math.sqrt(dx * dx + dy * dy) / dt;
        const velocityFactor = Math.max(0.5, Math.min(1, 1 - velocity * 0.005));
        width *= velocityFactor;
    }

    return Math.max(0.5, width);
}

export function SketchCanvas({ initialData, onChange, width = 800, height = 500 }: Props) {
    const canvasRef = useRef<HTMLCanvasElement>(null);
    const offscreenRef = useRef<HTMLCanvasElement | null>(null);
    const containerRef = useRef<HTMLDivElement>(null);
    const rafRef = useRef<number>(0);

    // State
    const [strokes, setStrokes] = useState<Stroke[]>(initialData?.strokes || []);
    const [currentStroke, setCurrentStroke] = useState<Stroke | null>(null);
    const [shapeStart, setShapeStart] = useState<Point | null>(null);
    const [history, setHistory] = useState<Stroke[][]>([initialData?.strokes || []]);
    const [historyIndex, setHistoryIndex] = useState(0);
    const [background, setBackground] = useState<BackgroundType>(initialData?.background || 'solid');

    const [settings, setSettings] = useState<SketchSettings>({
        tool: 'pen',
        color: '#ffffff',
        strokeWidth: 4,
        opacity: 1,
        pressureSensitivity: 0.8,
        smoothing: 0.5,
        tiltEnabled: true,
    });

    const [view, setView] = useState<ViewState>({
        zoom: initialData?.zoom || 1,
        panX: initialData?.panX || 0,
        panY: initialData?.panY || 0,
        isSpaceDown: false,
    });

    const [isDrawing, setIsDrawing] = useState(false);
    const [isPanning, setIsPanning] = useState(false);
    const [lastPanPoint, setLastPanPoint] = useState<{ x: number; y: number } | null>(null);

    // Initialize offscreen canvas
    useEffect(() => {
        offscreenRef.current = document.createElement('canvas');
        offscreenRef.current.width = width;
        offscreenRef.current.height = height;
    }, [width, height]);

    // Draw background pattern
    const drawBackground = useCallback((ctx: CanvasRenderingContext2D) => {
        ctx.fillStyle = '#18181b';
        ctx.fillRect(0, 0, width, height);

        ctx.strokeStyle = '#27272a';
        ctx.lineWidth = 1;

        const gridSize = 20 / view.zoom;
        const offsetX = view.panX % gridSize;
        const offsetY = view.panY % gridSize;

        switch (background) {
            case 'grid':
                ctx.beginPath();
                for (let x = offsetX; x < width; x += gridSize) {
                    ctx.moveTo(x, 0);
                    ctx.lineTo(x, height);
                }
                for (let y = offsetY; y < height; y += gridSize) {
                    ctx.moveTo(0, y);
                    ctx.lineTo(width, y);
                }
                ctx.stroke();
                break;

            case 'dots':
                ctx.fillStyle = '#3f3f46';
                for (let x = offsetX; x < width; x += gridSize) {
                    for (let y = offsetY; y < height; y += gridSize) {
                        ctx.beginPath();
                        ctx.arc(x, y, 1.5, 0, Math.PI * 2);
                        ctx.fill();
                    }
                }
                break;

            case 'lines':
                ctx.beginPath();
                for (let y = offsetY; y < height; y += gridSize) {
                    ctx.moveTo(0, y);
                    ctx.lineTo(width, y);
                }
                ctx.stroke();
                break;
        }
    }, [width, height, background, view]);

    // Draw a single stroke with pressure/tilt
    const drawStroke = useCallback((ctx: CanvasRenderingContext2D, stroke: Stroke, zoom: number) => {
        if (stroke.points.length < 2) return;

        // Apply smoothing
        const points = settings.smoothing > 0
            ? smoothStroke(stroke.points, Math.ceil(settings.smoothing * 8))
            : stroke.points;

        ctx.lineCap = 'round';
        ctx.lineJoin = 'round';
        ctx.globalAlpha = stroke.opacity;

        const isEraser = stroke.tool === 'eraser';
        ctx.globalCompositeOperation = isEraser ? 'destination-out' : 'source-over';

        // Draw stroke segments with variable width
        for (let i = 1; i < points.length; i++) {
            const prev = points[i - 1];
            const curr = points[i];

            const strokeWidth = calculateWidth(
                curr,
                prev,
                stroke.baseWidth * zoom,
                settings.pressureSensitivity,
                stroke.tool
            );

            ctx.beginPath();
            ctx.strokeStyle = isEraser ? '#18181b' : stroke.color;
            ctx.lineWidth = strokeWidth;

            // Apply tilt for brush angle (marker effect)
            if (settings.tiltEnabled && stroke.tool === 'marker') {
                const tiltAngle = Math.atan2(curr.tiltY, curr.tiltX);
                ctx.save();
                ctx.translate(curr.x, curr.y);
                ctx.rotate(tiltAngle);
                ctx.scale(1, 0.5 + Math.abs(curr.tiltX) * 0.01);
                ctx.translate(-curr.x, -curr.y);
            }

            ctx.moveTo(prev.x, prev.y);
            ctx.lineTo(curr.x, curr.y);
            ctx.stroke();

            if (settings.tiltEnabled && stroke.tool === 'marker') {
                ctx.restore();
            }
        }

        ctx.globalAlpha = 1;
        ctx.globalCompositeOperation = 'source-over';
    }, [settings]);

    // Draw shape preview
    const drawShapePreview = useCallback((ctx: CanvasRenderingContext2D, start: Point, end: Point) => {
        ctx.strokeStyle = settings.color;
        ctx.lineWidth = settings.strokeWidth * view.zoom;
        ctx.lineCap = 'round';
        ctx.lineJoin = 'round';
        ctx.setLineDash([5, 5]);

        const dx = end.x - start.x;
        const dy = end.y - start.y;

        ctx.beginPath();

        switch (settings.tool) {
            case 'line':
                ctx.moveTo(start.x, start.y);
                ctx.lineTo(end.x, end.y);
                break;

            case 'rectangle':
                ctx.rect(start.x, start.y, dx, dy);
                break;

            case 'circle':
                const radius = Math.sqrt(dx * dx + dy * dy);
                ctx.arc(start.x, start.y, radius, 0, Math.PI * 2);
                break;

            case 'arrow':
                ctx.moveTo(start.x, start.y);
                ctx.lineTo(end.x, end.y);
                // Arrow head
                const angle = Math.atan2(dy, dx);
                const headLen = 15 * view.zoom;
                ctx.lineTo(
                    end.x - headLen * Math.cos(angle - Math.PI / 6),
                    end.y - headLen * Math.sin(angle - Math.PI / 6)
                );
                ctx.moveTo(end.x, end.y);
                ctx.lineTo(
                    end.x - headLen * Math.cos(angle + Math.PI / 6),
                    end.y - headLen * Math.sin(angle + Math.PI / 6)
                );
                break;
        }

        ctx.stroke();
        ctx.setLineDash([]);
    }, [settings, view.zoom]);

    // Render loop using requestAnimationFrame
    const render = useCallback(() => {
        const canvas = canvasRef.current;
        const offscreen = offscreenRef.current;
        if (!canvas || !offscreen) return;

        const ctx = canvas.getContext('2d');
        const offCtx = offscreen.getContext('2d');
        if (!ctx || !offCtx) return;

        // Draw to offscreen canvas first (performance optimization)
        drawBackground(offCtx);

        // Apply zoom and pan transform
        offCtx.save();
        offCtx.translate(view.panX, view.panY);
        offCtx.scale(view.zoom, view.zoom);

        // Draw all strokes
        for (const stroke of strokes) {
            drawStroke(offCtx, stroke, view.zoom);
        }

        // Draw current stroke
        if (currentStroke) {
            drawStroke(offCtx, currentStroke, view.zoom);
        }

        // Draw shape preview
        if (shapeStart && currentStroke?.points.length) {
            const lastPoint = currentStroke.points[currentStroke.points.length - 1];
            drawShapePreview(offCtx, shapeStart, lastPoint);
        }

        offCtx.restore();

        // Copy to visible canvas
        ctx.drawImage(offscreen, 0, 0);
    }, [drawBackground, drawStroke, drawShapePreview, strokes, currentStroke, shapeStart, view]);

    // Redraw on changes
    useEffect(() => {
        rafRef.current = requestAnimationFrame(render);
        return () => cancelAnimationFrame(rafRef.current);
    }, [render]);

    // Get point from pointer event with full data
    const getPoint = useCallback((e: React.PointerEvent): Point => {
        const canvas = canvasRef.current;
        if (!canvas) return { x: 0, y: 0, pressure: 0.5, tiltX: 0, tiltY: 0, timestamp: Date.now() };

        const rect = canvas.getBoundingClientRect();
        const scaleX = canvas.width / rect.width;
        const scaleY = canvas.height / rect.height;

        // Transform from screen to canvas coordinates (accounting for zoom/pan)
        const canvasX = (e.clientX - rect.left) * scaleX;
        const canvasY = (e.clientY - rect.top) * scaleY;

        // Transform to world coordinates
        const worldX = (canvasX - view.panX) / view.zoom;
        const worldY = (canvasY - view.panY) / view.zoom;

        return {
            x: worldX,
            y: worldY,
            pressure: e.pressure || 0.5,
            tiltX: e.tiltX || 0,
            tiltY: e.tiltY || 0,
            timestamp: Date.now(),
        };
    }, [view]);

    // Check if tool is a shape tool
    const isShapeTool = (tool: SketchTool) => ['line', 'rectangle', 'circle', 'arrow'].includes(tool);

    // Start drawing/panning
    const handlePointerDown = useCallback((e: React.PointerEvent) => {
        e.preventDefault();
        const canvas = canvasRef.current;
        if (!canvas) return;
        canvas.setPointerCapture(e.pointerId);

        // Pan mode
        if (view.isSpaceDown || e.button === 1) {
            setIsPanning(true);
            setLastPanPoint({ x: e.clientX, y: e.clientY });
            return;
        }

        const point = getPoint(e);

        if (isShapeTool(settings.tool)) {
            setShapeStart(point);
        }

        const newStroke: Stroke = {
            id: crypto.randomUUID(),
            points: [point],
            color: settings.color,
            baseWidth: settings.strokeWidth,
            tool: settings.tool,
            opacity: settings.opacity,
        };

        setCurrentStroke(newStroke);
        setIsDrawing(true);
    }, [getPoint, settings, view.isSpaceDown]);

    // Continue drawing/panning
    const handlePointerMove = useCallback((e: React.PointerEvent) => {
        // Panning
        if (isPanning && lastPanPoint) {
            const dx = e.clientX - lastPanPoint.x;
            const dy = e.clientY - lastPanPoint.y;
            setView(v => ({ ...v, panX: v.panX + dx, panY: v.panY + dy }));
            setLastPanPoint({ x: e.clientX, y: e.clientY });
            return;
        }

        if (!isDrawing || !currentStroke) return;
        const point = getPoint(e);

        // For shape tools, just update the last point
        if (isShapeTool(settings.tool)) {
            setCurrentStroke(prev => prev ? {
                ...prev,
                points: [prev.points[0], point],
            } : null);
        } else {
            setCurrentStroke(prev => prev ? {
                ...prev,
                points: [...prev.points, point],
            } : null);
        }
    }, [isDrawing, isPanning, currentStroke, lastPanPoint, getPoint, settings.tool]);

    // End drawing/panning
    const handlePointerUp = useCallback(() => {
        if (isPanning) {
            setIsPanning(false);
            setLastPanPoint(null);
            return;
        }

        if (!currentStroke) return;

        // For shape tools, create final shape stroke
        let finalStroke = currentStroke;
        if (isShapeTool(settings.tool) && shapeStart && currentStroke.points.length >= 2) {
            const endPoint = currentStroke.points[currentStroke.points.length - 1];
            finalStroke = createShapeStroke(shapeStart, endPoint, settings);
        }

        const newStrokes = [...strokes, finalStroke];
        setStrokes(newStrokes);
        setCurrentStroke(null);
        setShapeStart(null);
        setIsDrawing(false);

        // Update history
        const newHistory = history.slice(0, historyIndex + 1);
        newHistory.push(newStrokes);
        setHistory(newHistory);
        setHistoryIndex(newHistory.length - 1);

        // Notify parent
        onChange?.({
            strokes: newStrokes,
            width,
            height,
            background,
            zoom: view.zoom,
            panX: view.panX,
            panY: view.panY,
        });
    }, [currentStroke, strokes, history, historyIndex, onChange, width, height, background, view, shapeStart, settings]);

    // Create shape stroke from start/end points
    const createShapeStroke = (start: Point, end: Point, settings: SketchSettings): Stroke => {
        const points: Point[] = [];
        const dx = end.x - start.x;
        const dy = end.y - start.y;

        switch (settings.tool) {
            case 'line':
                points.push(start, end);
                break;

            case 'rectangle':
                points.push(
                    start,
                    { ...start, x: end.x },
                    end,
                    { ...start, y: end.y },
                    start
                );
                break;

            case 'circle':
                const radius = Math.sqrt(dx * dx + dy * dy);
                const steps = Math.max(32, Math.floor(radius / 2));
                for (let i = 0; i <= steps; i++) {
                    const angle = (i / steps) * Math.PI * 2;
                    points.push({
                        x: start.x + Math.cos(angle) * radius,
                        y: start.y + Math.sin(angle) * radius,
                        pressure: 0.5,
                        tiltX: 0,
                        tiltY: 0,
                        timestamp: Date.now(),
                    });
                }
                break;

            case 'arrow':
                const angle = Math.atan2(dy, dx);
                const headLen = 15;
                points.push(start, end);
                points.push({
                    x: end.x - headLen * Math.cos(angle - Math.PI / 6),
                    y: end.y - headLen * Math.sin(angle - Math.PI / 6),
                    pressure: 0.5, tiltX: 0, tiltY: 0, timestamp: Date.now(),
                });
                points.push(end);
                points.push({
                    x: end.x - headLen * Math.cos(angle + Math.PI / 6),
                    y: end.y - headLen * Math.sin(angle + Math.PI / 6),
                    pressure: 0.5, tiltX: 0, tiltY: 0, timestamp: Date.now(),
                });
                break;
        }

        return {
            id: crypto.randomUUID(),
            points,
            color: settings.color,
            baseWidth: settings.strokeWidth,
            tool: settings.tool,
            opacity: settings.opacity,
        };
    };

    // Keyboard handlers for pan mode
    useEffect(() => {
        const handleKeyDown = (e: KeyboardEvent) => {
            if (e.code === 'Space' && !e.repeat) {
                e.preventDefault();
                setView(v => ({ ...v, isSpaceDown: true }));
            }
        };

        const handleKeyUp = (e: KeyboardEvent) => {
            if (e.code === 'Space') {
                setView(v => ({ ...v, isSpaceDown: false }));
            }
        };

        window.addEventListener('keydown', handleKeyDown);
        window.addEventListener('keyup', handleKeyUp);

        return () => {
            window.removeEventListener('keydown', handleKeyDown);
            window.removeEventListener('keyup', handleKeyUp);
        };
    }, []);

    // Zoom with wheel
    const handleWheel = useCallback((e: React.WheelEvent) => {
        e.preventDefault();
        const delta = e.deltaY > 0 ? 0.9 : 1.1;
        const newZoom = Math.min(5, Math.max(0.1, view.zoom * delta));

        // Zoom toward cursor
        const rect = canvasRef.current?.getBoundingClientRect();
        if (rect) {
            const mouseX = e.clientX - rect.left;
            const mouseY = e.clientY - rect.top;
            const zoomRatio = newZoom / view.zoom;

            setView(v => ({
                ...v,
                zoom: newZoom,
                panX: mouseX - (mouseX - v.panX) * zoomRatio,
                panY: mouseY - (mouseY - v.panY) * zoomRatio,
            }));
        }
    }, [view]);

    // Undo/Redo
    const undo = useCallback(() => {
        if (historyIndex > 0) {
            const newIndex = historyIndex - 1;
            setHistoryIndex(newIndex);
            setStrokes(history[newIndex]);
        }
    }, [historyIndex, history]);

    const redo = useCallback(() => {
        if (historyIndex < history.length - 1) {
            const newIndex = historyIndex + 1;
            setHistoryIndex(newIndex);
            setStrokes(history[newIndex]);
        }
    }, [historyIndex, history]);

    // Clear
    const clear = useCallback(() => {
        setStrokes([]);
        const newHistory = history.slice(0, historyIndex + 1);
        newHistory.push([]);
        setHistory(newHistory);
        setHistoryIndex(newHistory.length - 1);
    }, [history, historyIndex]);

    // Reset view
    const resetView = useCallback(() => {
        setView({ zoom: 1, panX: 0, panY: 0, isSpaceDown: false });
    }, []);

    // Export PNG
    const exportPNG = useCallback(() => {
        const canvas = canvasRef.current;
        if (!canvas) return;
        const link = document.createElement('a');
        link.download = `sketch-${Date.now()}.png`;
        link.href = canvas.toDataURL('image/png');
        link.click();
    }, []);

    // Cursor style
    const cursor = useMemo(() => {
        if (view.isSpaceDown || isPanning) return 'grab';
        if (settings.tool === 'eraser') return 'crosshair';
        return 'crosshair';
    }, [view.isSpaceDown, isPanning, settings.tool]);

    return (
        <div ref={containerRef} className="flex flex-col gap-3">
            {/* Main Toolbar */}
            <div className="flex items-center gap-2 flex-wrap">
                {/* Tools */}
                <div className="flex gap-0.5 p-1 bg-zinc-800 rounded-lg">
                    {TOOLS.map(({ tool, label, icon }) => (
                        <button
                            key={tool}
                            onClick={() => setSettings(s => ({ ...s, tool }))}
                            className={`p-2 rounded transition-colors ${settings.tool === tool ? 'bg-violet-600 text-white' : 'text-zinc-400 hover:bg-zinc-700'
                                }`}
                            title={label}
                        >
                            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d={icon} />
                            </svg>
                        </button>
                    ))}
                </div>

                {/* Colors */}
                <div className="flex gap-0.5 p-1 bg-zinc-800 rounded-lg">
                    {COLORS.map(color => (
                        <button
                            key={color}
                            onClick={() => setSettings(s => ({ ...s, color, tool: s.tool === 'eraser' ? 'pen' : s.tool }))}
                            className={`w-5 h-5 rounded-full transition-transform border ${settings.color === color && settings.tool !== 'eraser'
                                    ? 'ring-2 ring-violet-500 ring-offset-1 ring-offset-zinc-900 scale-110 border-white/50'
                                    : 'hover:scale-110 border-transparent'
                                }`}
                            style={{ backgroundColor: color }}
                            title={color}
                        />
                    ))}
                </div>

                {/* Stroke Width */}
                <div className="flex gap-0.5 p-1 bg-zinc-800 rounded-lg">
                    {STROKE_WIDTHS.map(w => (
                        <button
                            key={w}
                            onClick={() => setSettings(s => ({ ...s, strokeWidth: w }))}
                            className={`w-7 h-7 rounded flex items-center justify-center transition-colors ${settings.strokeWidth === w ? 'bg-violet-600' : 'hover:bg-zinc-700'
                                }`}
                            title={`${w}px`}
                        >
                            <div className="rounded-full bg-white" style={{ width: Math.min(w, 12), height: Math.min(w, 12) }} />
                        </button>
                    ))}
                </div>

                {/* Background */}
                <div className="flex gap-0.5 p-1 bg-zinc-800 rounded-lg">
                    {BACKGROUNDS.map(({ type, label }) => (
                        <button
                            key={type}
                            onClick={() => setBackground(type)}
                            className={`px-2 py-1 rounded text-xs transition-colors ${background === type ? 'bg-violet-600 text-white' : 'text-zinc-400 hover:bg-zinc-700'
                                }`}
                            title={label}
                        >
                            {label}
                        </button>
                    ))}
                </div>
            </div>

            {/* Secondary Toolbar */}
            <div className="flex items-center gap-2 flex-wrap text-xs">
                {/* Pressure Sensitivity */}
                <div className="flex items-center gap-2 px-2 py-1 bg-zinc-800 rounded-lg">
                    <span className="text-zinc-500">Pressure</span>
                    <input
                        type="range"
                        min="0"
                        max="1"
                        step="0.1"
                        value={settings.pressureSensitivity}
                        onChange={(e) => setSettings(s => ({ ...s, pressureSensitivity: parseFloat(e.target.value) }))}
                        className="w-16 accent-violet-500"
                    />
                    <span className="text-zinc-400 w-6">{Math.round(settings.pressureSensitivity * 100)}%</span>
                </div>

                {/* Smoothing */}
                <div className="flex items-center gap-2 px-2 py-1 bg-zinc-800 rounded-lg">
                    <span className="text-zinc-500">Smooth</span>
                    <input
                        type="range"
                        min="0"
                        max="1"
                        step="0.1"
                        value={settings.smoothing}
                        onChange={(e) => setSettings(s => ({ ...s, smoothing: parseFloat(e.target.value) }))}
                        className="w-16 accent-violet-500"
                    />
                    <span className="text-zinc-400 w-6">{Math.round(settings.smoothing * 100)}%</span>
                </div>

                {/* Opacity */}
                <div className="flex items-center gap-2 px-2 py-1 bg-zinc-800 rounded-lg">
                    <span className="text-zinc-500">Opacity</span>
                    <input
                        type="range"
                        min="0.1"
                        max="1"
                        step="0.1"
                        value={settings.opacity}
                        onChange={(e) => setSettings(s => ({ ...s, opacity: parseFloat(e.target.value) }))}
                        className="w-16 accent-violet-500"
                    />
                    <span className="text-zinc-400 w-6">{Math.round(settings.opacity * 100)}%</span>
                </div>

                {/* Tilt Toggle */}
                <button
                    onClick={() => setSettings(s => ({ ...s, tiltEnabled: !s.tiltEnabled }))}
                    className={`px-2 py-1 rounded-lg transition-colors ${settings.tiltEnabled ? 'bg-violet-600 text-white' : 'bg-zinc-800 text-zinc-400'
                        }`}
                    title="Enable pen tilt for brush angle"
                >
                    Tilt
                </button>

                <div className="flex-1" />

                {/* Zoom Controls */}
                <div className="flex items-center gap-1 px-2 py-1 bg-zinc-800 rounded-lg">
                    <button onClick={() => setView(v => ({ ...v, zoom: Math.max(0.1, v.zoom * 0.8) }))} className="p-1 hover:bg-zinc-700 rounded">
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20 12H4" />
                        </svg>
                    </button>
                    <span className="text-zinc-400 w-12 text-center">{Math.round(view.zoom * 100)}%</span>
                    <button onClick={() => setView(v => ({ ...v, zoom: Math.min(5, v.zoom * 1.25) }))} className="p-1 hover:bg-zinc-700 rounded">
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                        </svg>
                    </button>
                    <button onClick={resetView} className="p-1 hover:bg-zinc-700 rounded text-zinc-400" title="Reset view">
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                        </svg>
                    </button>
                </div>

                {/* Actions */}
                <div className="flex gap-1 p-1 bg-zinc-800 rounded-lg">
                    <button onClick={undo} disabled={historyIndex <= 0} className="p-1 rounded text-zinc-400 hover:bg-zinc-700 disabled:opacity-30" title="Undo (Ctrl+Z)">
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 10h10a8 8 0 018 8v2M3 10l6 6m-6-6l6-6" />
                        </svg>
                    </button>
                    <button onClick={redo} disabled={historyIndex >= history.length - 1} className="p-1 rounded text-zinc-400 hover:bg-zinc-700 disabled:opacity-30" title="Redo">
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 10h-10a8 8 0 00-8 8v2M21 10l-6 6m6-6l-6-6" />
                        </svg>
                    </button>
                    <button onClick={clear} className="p-1 rounded text-zinc-400 hover:bg-zinc-700 hover:text-red-400" title="Clear">
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                        </svg>
                    </button>
                    <button onClick={exportPNG} className="p-1 rounded text-zinc-400 hover:bg-zinc-700" title="Export PNG">
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
                        </svg>
                    </button>
                </div>
            </div>

            {/* Canvas */}
            <div className="rounded-lg overflow-hidden border border-zinc-700">
                <canvas
                    ref={canvasRef}
                    width={width}
                    height={height}
                    className="w-full touch-none select-none"
                    style={{ aspectRatio: `${width}/${height}`, cursor }}
                    onPointerDown={handlePointerDown}
                    onPointerMove={handlePointerMove}
                    onPointerUp={handlePointerUp}
                    onPointerLeave={handlePointerUp}
                    onWheel={handleWheel}
                />
            </div>

            {/* Status Bar */}
            <div className="flex justify-between text-xs text-zinc-500">
                <span>{strokes.length} stroke{strokes.length !== 1 ? 's' : ''} • Hold Space to pan • Scroll to zoom</span>
                <span>{settings.tool} • {settings.strokeWidth}px • {Math.round(settings.opacity * 100)}% opacity</span>
            </div>
        </div>
    );
}
