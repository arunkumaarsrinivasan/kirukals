'use client';

import { noiseOverlaySvg } from '@/lib/theme';

interface NoiseOverlayProps {
    opacity?: number;
    zIndex?: number;
}

/**
 * NoiseOverlay — Full-viewport fractal noise texture.
 *
 * Creates a subtle film-grain / print-static effect characteristic
 * of the RAW_INPUT aesthetic. Place once per layout, as the topmost layer.
 */
export function NoiseOverlay({ opacity = 0.08, zIndex = 9999 }: NoiseOverlayProps) {
    return (
        <div
            aria-hidden
            style={{
                position: 'fixed',
                inset: 0,
                pointerEvents: 'none',
                zIndex,
                opacity,
                backgroundImage: noiseOverlaySvg,
                backgroundSize: '200px 200px',
            }}
        />
    );
}
