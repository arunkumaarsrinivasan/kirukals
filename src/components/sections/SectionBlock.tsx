'use client';

import React, { useState, useRef, useCallback, useEffect } from 'react';
import type { SectionBlock as SectionBlockType } from '@/types/blocks';
import type { Stroke, Point, BackgroundType } from '@/types/sketch';
import type { SketchSettings } from '@/types/sketch';
import { useEditorStore } from '@/store/editor';

interface Props {
    block: SectionBlockType;
    globalSettings: SketchSettings;
}

// Catmull-Rom spline for smooth curves
function catmullRomSpline(p0: Point, p1: Point, p2: Point, p3: Point, t: number): Point {
    const t2 = t * t;
    const t3 = t2 * t;
    const x = 0.5 * ((2 * p1.x) + (-p0.x + p2.x) * t + (2 * p0.x - 5 * p1.x + 4 * p2.x - p3.x) * t2 + (-p0.x + 3 * p1.x - 3 * p2.x + p3.x) * t3);
    const y = 0.5 * ((2 * p1.y) + (-p0.y + p2.y) * t + (2 * p0.y - 5 * p1.y + 4 * p2.y - p3.y) * t2 + (-p0.y + 3 * p1.y - 3 * p2.y + p3.y) * t3);
    const pressure = p1.pressure + (p2.pressure - p1.pressure) * t;
    return { x, y, pressure, tiltX: p1.tiltX, tiltY: p1.tiltY, timestamp: Date.now() };
}

function smoothStroke(points: Point[], segments: number = 4): Point[] {
    if (points.length < 4) return points;
    const smoothed: Point[] = [points[0]];
    for (let i = 0; i < points.length - 1; i++) {
        const p0 = points[Math.max(0, i - 1)];
        const p1 = points[i];
        const p2 = points[Math.min(points.length - 1, i + 1)];
        const p3 = points[Math.min(points.length - 1, i + 2)];
        for (let j = 1; j <= segments; j++) {
            smoothed.push(catmullRomSpline(p0, p1, p2, p3, j / segments));
        }
    }
    return smoothed;
}

export function SectionElement({ block, globalSettings }: Props) {
    const { updateSketchData, theme } = useEditorStore();
    const canvasRef = useRef<HTMLCanvasElement>(null);
    const containerRef = useRef<HTMLDivElement>(null);

    // Track actual canvas dimensions
    const [canvasSize, setCanvasSize] = useState({ width: 0, height: block.height });

    // Drawing state
    const [strokes, setStrokes] = useState<Stroke[]>(block.sketchData?.strokes || []);
    const [currentStroke, setCurrentStroke] = useState<Stroke | null>(null);
    const [isDrawing, setIsDrawing] = useState(false);
    // Default to solid (plain) background
    const [background] = useState<BackgroundType>(block.sketchData?.background || 'solid');

    // Use block's custom backgroundColor if set, otherwise fall back to theme
    const bgColor = block.backgroundColor || (theme === 'dark' ? '#0a0a0b' : '#fafafa');
    const gridColor = theme === 'dark' ? '#27272a' : '#e4e4e7';
    const dotColor = theme === 'dark' ? '#3f3f46' : '#a1a1aa';

    // Observe container size for responsive canvas
    useEffect(() => {
        const container = containerRef.current;
        if (!container) return;

        const updateSize = () => {
            const width = container.clientWidth;
            if (width > 0) {
                setCanvasSize({ width, height: block.height });
            }
        };

        updateSize();

        const resizeObserver = new ResizeObserver(updateSize);
        resizeObserver.observe(container);

        return () => resizeObserver.disconnect();
    }, [block.height]);

    // Draw background
    const drawBackground = useCallback((ctx: CanvasRenderingContext2D, width: number, height: number) => {
        ctx.fillStyle = bgColor;
        ctx.fillRect(0, 0, width, height);

        if (background === 'solid') return; // Plain background, nothing more to draw

        ctx.strokeStyle = gridColor;
        ctx.lineWidth = 1;
        const gridSize = 20;

        switch (background) {
            case 'grid':
            case 'blueprint':
                ctx.beginPath();
                for (let x = 0; x < width; x += gridSize) {
                    ctx.moveTo(x, 0);
                    ctx.lineTo(x, height);
                }
                for (let y = 0; y < height; y += gridSize) {
                    ctx.moveTo(0, y);
                    ctx.lineTo(width, y);
                }
                ctx.stroke();
                break;
            case 'dots':
                ctx.fillStyle = dotColor;
                for (let x = gridSize; x < width; x += gridSize) {
                    for (let y = gridSize; y < height; y += gridSize) {
                        ctx.beginPath();
                        ctx.arc(x, y, 1.5, 0, Math.PI * 2);
                        ctx.fill();
                    }
                }
                break;
            case 'lines':
                ctx.beginPath();
                for (let y = gridSize; y < height; y += gridSize) {
                    ctx.moveTo(0, y);
                    ctx.lineTo(width, y);
                }
                ctx.stroke();
                break;
        }
    }, [background, bgColor, gridColor, dotColor]);

    // Draw stroke
    const drawStroke = useCallback((ctx: CanvasRenderingContext2D, stroke: Stroke) => {
        if (stroke.points.length < 2) return;
        const points = globalSettings.smoothing > 0
            ? smoothStroke(stroke.points, Math.ceil(globalSettings.smoothing * 8))
            : stroke.points;

        ctx.lineCap = 'round';
        ctx.lineJoin = 'round';
        ctx.globalAlpha = stroke.opacity;
        const isEraser = stroke.tool === 'eraser';
        ctx.globalCompositeOperation = isEraser ? 'destination-out' : 'source-over';

        for (let i = 1; i < points.length; i++) {
            const prev = points[i - 1];
            const curr = points[i];
            let strokeWidth = stroke.baseWidth;

            if (globalSettings.pressureSensitivity > 0) {
                strokeWidth *= 0.3 + (curr.pressure * 0.7 * globalSettings.pressureSensitivity);
            }

            // Calligraphy effect
            if (stroke.tool === 'calligraphy' && prev) {
                const angle = Math.atan2(curr.y - prev.y, curr.x - prev.x);
                const nibAngle = (globalSettings.nibAngle || 45) * Math.PI / 180;
                const angleFactor = Math.abs(Math.sin(angle - nibAngle));
                strokeWidth = strokeWidth * (0.3 + angleFactor * 0.7);
            }

            ctx.beginPath();
            ctx.strokeStyle = isEraser ? bgColor : stroke.color;
            ctx.lineWidth = strokeWidth;
            ctx.moveTo(prev.x, prev.y);
            ctx.lineTo(curr.x, curr.y);
            ctx.stroke();
        }
        ctx.globalAlpha = 1;
        ctx.globalCompositeOperation = 'source-over';
    }, [globalSettings, bgColor]);

    // Render canvas
    useEffect(() => {
        const canvas = canvasRef.current;
        if (!canvas || canvasSize.width === 0) return;
        const ctx = canvas.getContext('2d');
        if (!ctx) return;

        // Set canvas resolution to match container size (1:1 ratio fixes cursor offset)
        canvas.width = canvasSize.width;
        canvas.height = canvasSize.height;

        drawBackground(ctx, canvasSize.width, canvasSize.height);
        strokes.forEach(s => drawStroke(ctx, s));
        if (currentStroke) drawStroke(ctx, currentStroke);
    }, [strokes, currentStroke, canvasSize, drawBackground, drawStroke]);

    // Get point from event - FIXED: proper coordinate calculation
    const getPoint = useCallback((e: React.PointerEvent): Point => {
        const canvas = canvasRef.current;
        if (!canvas) return { x: 0, y: 0, pressure: 0.5, tiltX: 0, tiltY: 0, timestamp: Date.now() };

        const rect = canvas.getBoundingClientRect();
        // Calculate scale factors in case CSS size differs from canvas resolution
        const scaleX = canvas.width / rect.width;
        const scaleY = canvas.height / rect.height;

        return {
            x: (e.clientX - rect.left) * scaleX,
            y: (e.clientY - rect.top) * scaleY,
            pressure: e.pressure || 0.5,
            tiltX: e.tiltX || 0,
            tiltY: e.tiltY || 0,
            timestamp: Date.now(),
        };
    }, []);

    const handlePointerDown = useCallback((e: React.PointerEvent) => {
        e.stopPropagation();
        canvasRef.current?.setPointerCapture(e.pointerId);
        const point = getPoint(e);
        const newStroke: Stroke = {
            id: crypto.randomUUID(),
            points: [point],
            color: globalSettings.color,
            baseWidth: globalSettings.strokeWidth,
            tool: globalSettings.tool,
            opacity: globalSettings.opacity,
        };
        setCurrentStroke(newStroke);
        setIsDrawing(true);
    }, [getPoint, globalSettings]);

    const handlePointerMove = useCallback((e: React.PointerEvent) => {
        if (!isDrawing || !currentStroke) return;
        const point = getPoint(e);
        setCurrentStroke(prev => prev ? { ...prev, points: [...prev.points, point] } : null);
    }, [isDrawing, currentStroke, getPoint]);

    const handlePointerUp = useCallback(() => {
        if (!currentStroke) return;
        const newStrokes = [...strokes, currentStroke];
        setStrokes(newStrokes);
        setCurrentStroke(null);
        setIsDrawing(false);
        updateSketchData(block.id, {
            strokes: newStrokes,
            width: canvasSize.width,
            height: canvasSize.height,
            background,
            zoom: 1,
            panX: 0,
            panY: 0,
        });
    }, [currentStroke, strokes, block.id, canvasSize, updateSketchData, background]);

    return (
        <div ref={containerRef} className="w-full h-full">
            <canvas
                ref={canvasRef}
                className="w-full h-full cursor-crosshair touch-none"
                style={{ display: 'block' }}
                onPointerDown={handlePointerDown}
                onPointerMove={handlePointerMove}
                onPointerUp={handlePointerUp}
                onPointerLeave={handlePointerUp}
            />
        </div>
    );
}
