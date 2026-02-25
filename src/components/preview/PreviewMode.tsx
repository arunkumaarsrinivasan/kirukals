'use client';

import { useMemo, useEffect, useRef, useCallback } from 'react';
import { useEditorStore } from '@/store/editor';
import type { Block, SectionBlock, TextBlock, EmbedBlock, MediaBlock, MarkdownBlock, DiagramBlock } from '@/types/blocks';
import type { Stroke, Point } from '@/types/sketch';
import { getEmbedUrl } from '@/utils/embedUtils';

/**
 * Parse markdown to HTML
 */
function parseMarkdown(md: string, theme: 'light' | 'dark'): string {
    if (!md) return '';
    const codeColor = theme === 'dark' ? '#a78bfa' : '#7c3aed';
    const codeBg = theme === 'dark' ? '#27272a' : '#f4f4f5';

    return md
        .replace(/&/g, '&amp;')
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;')
        .replace(/^### (.+)$/gm, '<h3>$1</h3>')
        .replace(/^## (.+)$/gm, '<h2>$1</h2>')
        .replace(/^# (.+)$/gm, '<h1>$1</h1>')
        .replace(/\*\*\*(.+?)\*\*\*/g, '<strong><em>$1</em></strong>')
        .replace(/\*\*(.+?)\*\*/g, '<strong>$1</strong>')
        .replace(/\*(.+?)\*/g, '<em>$1</em>')
        .replace(/`([^`]+)`/g, `<code style="padding: 0.125rem 0.375rem; background: ${codeBg}; color: ${codeColor}; border-radius: 0.25rem; font-family: monospace;">$1</code>`)
        .replace(/^> (.+)$/gm, '<blockquote style="border-left: 3px solid #8b5cf6; padding-left: 1rem; margin: 0.5rem 0; opacity: 0.8;">$1</blockquote>')
        .replace(/^[\*\-] (.+)$/gm, '<li style="margin-left: 1rem; list-style: disc;">$1</li>')
        .replace(/\[([^\]]+)\]\(([^)]+)\)/g, '<a href="$2" style="color: #a78bfa; text-decoration: underline;" target="_blank">$1</a>')
        .replace(/\n\n/g, '</p><p>')
        .replace(/\n/g, '<br/>');
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

/**
 * Section Canvas - renders section background and strokes
 */
function SectionCanvas({ section, theme, containerWidth }: { section: SectionBlock; theme: 'light' | 'dark'; containerWidth: number }) {
    const canvasRef = useRef<HTMLCanvasElement>(null);
    const bgColor = section.backgroundColor || (theme === 'dark' ? '#0a0a0b' : '#fafafa');

    const drawStroke = useCallback((ctx: CanvasRenderingContext2D, stroke: Stroke) => {
        if (stroke.points.length < 2) return;
        const points = smoothStroke(stroke.points, 4);

        ctx.lineCap = 'round';
        ctx.lineJoin = 'round';
        ctx.globalAlpha = stroke.opacity;
        const isEraser = stroke.tool === 'eraser';
        ctx.globalCompositeOperation = isEraser ? 'destination-out' : 'source-over';

        for (let i = 1; i < points.length; i++) {
            const prev = points[i - 1];
            const curr = points[i];
            let strokeWidth = stroke.baseWidth;
            strokeWidth *= 0.3 + (curr.pressure * 0.7);

            ctx.beginPath();
            ctx.strokeStyle = isEraser ? bgColor : stroke.color;
            ctx.lineWidth = strokeWidth;
            ctx.moveTo(prev.x, prev.y);
            ctx.lineTo(curr.x, curr.y);
            ctx.stroke();
        }
        ctx.globalAlpha = 1;
        ctx.globalCompositeOperation = 'source-over';
    }, [bgColor]);

    useEffect(() => {
        const canvas = canvasRef.current;
        if (!canvas || containerWidth === 0) return;
        const ctx = canvas.getContext('2d');
        if (!ctx) return;

        // Set canvas size to match container
        canvas.width = containerWidth;
        canvas.height = section.height;

        // Draw background
        ctx.fillStyle = bgColor;
        ctx.fillRect(0, 0, canvas.width, canvas.height);

        // Draw strokes if they exist
        if (section.sketchData?.strokes) {
            section.sketchData.strokes.forEach(stroke => drawStroke(ctx, stroke));
        }
    }, [section, bgColor, drawStroke, containerWidth]);

    return (
        <div
            className="w-full"
            style={{ height: section.height }}
        >
            <canvas
                ref={canvasRef}
                style={{ width: '100%', height: '100%', display: 'block' }}
            />
            {section.label && (
                <div style={{
                    position: 'absolute',
                    top: '0.5rem',
                    left: '1rem',
                    padding: '0.25rem 0.5rem',
                    borderRadius: '0.25rem',
                    fontSize: '0.75rem',
                    fontWeight: 500,
                    backgroundColor: theme === 'dark' ? 'rgba(139, 92, 246, 0.2)' : 'rgba(124, 58, 237, 0.1)',
                    color: theme === 'dark' ? '#a78bfa' : '#7c3aed'
                }}>
                    {section.label}
                </div>
            )}
        </div>
    );
}

interface PreviewModeProps {
    onClose: () => void;
}

export function PreviewMode({ onClose }: PreviewModeProps) {
    const { blocks, theme } = useEditorStore();
    const containerRef = useRef<HTMLDivElement>(null);

    // Separate sections and other blocks
    const sections = useMemo(() =>
        blocks.filter(b => b.type === 'section').sort((a, b) => a.y - b.y) as SectionBlock[],
        [blocks]
    );
    const otherBlocks = useMemo(() =>
        blocks.filter(b => b.type !== 'section'),
        [blocks]
    );

    // Track container width for responsive canvas
    const [containerWidth, setContainerWidth] = React.useState(0);
    useEffect(() => {
        const updateWidth = () => {
            if (containerRef.current) {
                setContainerWidth(containerRef.current.clientWidth);
            }
        };
        updateWidth();
        window.addEventListener('resize', updateWidth);
        return () => window.removeEventListener('resize', updateWidth);
    }, []);

    const bgColor = theme === 'dark' ? '#0a0a0b' : '#ffffff';
    const textColor = theme === 'dark' ? '#e4e4e7' : '#18181b';
    const borderColor = theme === 'dark' ? '#27272a' : '#e4e4e7';

    const renderBlock = (block: Block) => {
        const blockStyle: React.CSSProperties = {
            position: 'absolute',
            left: block.x,
            top: block.y,
            width: block.width,
            height: block.height,
            borderRadius: '0.5rem',
            overflow: 'hidden',
            zIndex: block.zIndex || 1,
        };

        switch (block.type) {
            case 'text':
                const textBlock = block as TextBlock;
                const displayText = textBlock.plainText ||
                    (typeof textBlock.content === 'string' ? textBlock.content : '');
                return (
                    <div key={block.id} style={{ ...blockStyle, backgroundColor: theme === 'dark' ? '#18181b' : '#fff' }}>
                        <div style={{
                            padding: '1rem',
                            fontSize: textBlock.fontSize || 16,
                            fontFamily: textBlock.fontFamily || 'sans-serif',
                            textAlign: textBlock.textAlign || 'left',
                            fontWeight: textBlock.fontWeight || 'normal',
                            color: textBlock.color || textColor,
                            whiteSpace: 'pre-wrap',
                            height: '100%',
                        }}>
                            {displayText}
                        </div>
                    </div>
                );

            case 'embed':
                const embedBlock = block as EmbedBlock;
                const embedUrl = getEmbedUrl(embedBlock.url, embedBlock.embedType);
                return (
                    <div key={block.id} style={{ ...blockStyle, backgroundColor: theme === 'dark' ? '#18181b' : '#fff' }}>
                        <iframe
                            src={embedUrl}
                            style={{ width: '100%', height: '100%', border: 'none' }}
                            allowFullScreen
                        />
                    </div>
                );

            case 'media':
                const mediaBlock = block as MediaBlock;
                return (
                    <div key={block.id} style={blockStyle}>
                        {mediaBlock.src ? (
                            <img
                                src={mediaBlock.src}
                                alt={mediaBlock.alt || 'Image'}
                                style={{
                                    width: '100%',
                                    height: '100%',
                                    objectFit: mediaBlock.objectFit || 'cover'
                                }}
                            />
                        ) : (
                            <div style={{
                                width: '100%',
                                height: '100%',
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'center',
                                backgroundColor: theme === 'dark' ? '#18181b' : '#f4f4f5',
                                color: '#71717a'
                            }}>
                                No image
                            </div>
                        )}
                    </div>
                );

            case 'markdown':
                const mdBlock = block as MarkdownBlock;
                return (
                    <div
                        key={block.id}
                        style={{ ...blockStyle, backgroundColor: theme === 'dark' ? '#18181b' : '#fff', padding: '1rem', color: textColor }}
                        dangerouslySetInnerHTML={{ __html: parseMarkdown(mdBlock.content, theme) }}
                    />
                );

            case 'diagram':
                const diagramBlock = block as DiagramBlock;
                return (
                    <div key={block.id} style={{ ...blockStyle, backgroundColor: theme === 'dark' ? '#18181b' : '#fff' }}>
                        <pre style={{
                            padding: '1rem',
                            margin: 0,
                            height: '100%',
                            overflow: 'auto',
                            fontSize: '0.875rem',
                            fontFamily: 'monospace',
                            color: textColor
                        }}>
                            {diagramBlock.source || 'No diagram'}
                        </pre>
                    </div>
                );

            default:
                return null;
        }
    };

    return (
        <div
            className="fixed inset-0 z-[100] overflow-auto"
            style={{ backgroundColor: bgColor, isolation: 'isolate' }}
        >
            {/* Header */}
            <div
                className="sticky top-0 z-10 backdrop-blur-xl border-b flex items-center justify-between px-6 py-4"
                style={{
                    backgroundColor: theme === 'dark' ? 'rgba(10, 10, 11, 0.9)' : 'rgba(255, 255, 255, 0.9)',
                    borderColor
                }}
            >
                <div className="flex items-center gap-3">
                    <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-violet-500 to-fuchsia-500 flex items-center justify-center">
                        <span className="text-white font-bold text-sm">K</span>
                    </div>
                    <span className="font-semibold" style={{ color: textColor }}>Preview Mode</span>
                </div>
                <button
                    onClick={onClose}
                    className="px-4 py-2 text-sm rounded-lg border transition-colors hover:bg-violet-500/10"
                    style={{ borderColor, color: textColor }}
                >
                    Close Preview
                </button>
            </div>

            {/* Content - mirrors editor layout exactly */}
            <div ref={containerRef} className="relative w-full" style={{ backgroundColor: bgColor }}>
                {/* Sections stack vertically, full width */}
                <div className="flex flex-col w-full">
                    {sections.map((section) => (
                        <div key={section.id} className="relative w-full">
                            <SectionCanvas section={section} theme={theme} containerWidth={containerWidth} />
                        </div>
                    ))}
                </div>

                {/* Other blocks positioned absolutely on top */}
                {otherBlocks.map(renderBlock)}

                {/* Empty state */}
                {blocks.length === 0 && (
                    <div className="text-center py-16" style={{ color: '#71717a' }}>
                        <p className="text-lg">No content to preview</p>
                        <p className="text-sm mt-2">Add blocks to your canvas first</p>
                    </div>
                )}
            </div>
        </div>
    );
}

// Import React for useState
import React from 'react';
