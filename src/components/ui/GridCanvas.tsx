'use client';

import React from 'react';

interface GridCanvasProps {
    /** Watermark text, top-left (rotated -90deg) */
    overlayStart?: string;
    /** Watermark text, bottom-right */
    overlayEnd?: string;
    /** Grid cell size in px. Default 40 */
    gridSize?: number;
    children?: React.ReactNode;
}

/**
 * GridCanvas — Canvas area wrapper with dot/line grid background.
 *
 * Renders a subtle grid using CSS `linear-gradient` (no canvas required).
 * Includes optional ghost watermark text overlays at start and end of the area.
 * Wrap your `<canvas>` or drawing surface inside this component.
 *
 * @example
 * <GridCanvas overlayStart="OBSERVATION" overlayEnd="DECAY">
 *   <RegistrationMarks />
 *   <canvas ref={canvasRef} width={800} height={600} />
 * </GridCanvas>
 */
export function GridCanvas({
    overlayStart,
    overlayEnd,
    gridSize = 40,
    children,
}: GridCanvasProps) {
    return (
        <main
            style={{
                position: 'relative',
                backgroundColor: 'var(--color-canvas-area)',
                backgroundImage: `
          linear-gradient(rgba(255,255,255,0.07) 1px, transparent 1px),
          linear-gradient(90deg, rgba(255,255,255,0.07) 1px, transparent 1px)
        `,
                backgroundSize: `${gridSize}px ${gridSize}px`,
                overflow: 'hidden',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
            }}
        >
            {/* Ghost watermark — top-left rotated */}
            {overlayStart && (
                <div
                    aria-hidden
                    style={{
                        position: 'absolute',
                        fontFamily: 'var(--font-display)',
                        fontSize: '6rem',
                        color: 'rgba(255,255,255,0.015)',
                        zIndex: 0,
                        pointerEvents: 'none',
                        whiteSpace: 'nowrap',
                        letterSpacing: '-5px',
                        top: '10%',
                        left: '-5%',
                        transform: 'rotate(-90deg)',
                        userSelect: 'none',
                    }}
                >
                    {overlayStart}
                </div>
            )}

            {/* Ghost watermark — bottom-right */}
            {overlayEnd && (
                <div
                    aria-hidden
                    style={{
                        position: 'absolute',
                        fontFamily: 'var(--font-display)',
                        fontSize: '6rem',
                        color: 'rgba(255,255,255,0.015)',
                        zIndex: 0,
                        pointerEvents: 'none',
                        whiteSpace: 'nowrap',
                        letterSpacing: '-5px',
                        bottom: 0,
                        right: 0,
                        userSelect: 'none',
                    }}
                >
                    {overlayEnd}
                </div>
            )}

            {/* Content (canvas, registration marks, etc.) */}
            <div style={{ position: 'relative', zIndex: 1 }}>{children}</div>
        </main>
    );
}
