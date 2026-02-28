'use client';

import React from 'react';

interface StatusBarProps {
    leftContent?: React.ReactNode;
    centerContent?: React.ReactNode;
    rightContent?: React.ReactNode;
}

/**
 * StatusBar — Thin footer bar with three content slots.
 *
 * Positioned at `gridColumn: 2; gridRow: 3` in the RAW_INPUT app grid.
 * Displays info like coordinates, mode, and scale in a monospaced, uppercase style.
 *
 * @example
 * <StatusBar
 *   leftContent={<>COORD: {coords}</>}
 *   centerContent="MODE: RASTER_EDIT"
 *   rightContent="SCALE: 100%"
 * />
 */
export function StatusBar({ leftContent, centerContent, rightContent }: StatusBarProps) {
    return (
        <div
            style={{
                gridColumn: 2,
                gridRow: 3,
                borderTop: '2px solid var(--color-border-strong)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                padding: '0 24px',
                fontSize: '0.7rem',
                textTransform: 'uppercase',
                backgroundColor: 'var(--color-bg)',
                color: 'var(--color-muted)',
                fontFamily: 'var(--font-mono)',
                letterSpacing: '0.05em',
                height: 'var(--status-bar-height, 40px)',
            }}
        >
            <span>{leftContent}</span>
            <span>{centerContent}</span>
            <span>{rightContent}</span>
        </div>
    );
}
