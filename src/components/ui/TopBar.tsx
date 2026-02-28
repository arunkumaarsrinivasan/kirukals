'use client';

import React from 'react';

export interface StatusItem {
    label: string;
    value?: string;
    /** If true, renders a blinking red dot before the value */
    blink?: boolean;
}

interface TopBarProps {
    brandName?: string;
    version?: string;
    statusItems?: StatusItem[];
    children?: React.ReactNode;
}

/**
 * TopBar — Full-width application header for the RAW_INPUT layout.
 *
 * Spans all columns (gridColumn: 1 / -1). Displays the brand name in
 * Archivo Black on the left, and status readouts on the right.
 *
 * @example
 * <TopBar
 *   brandName="KIRUKAL"
 *   version="1.0"
 *   statusItems={[
 *     { label: 'MEM', value: '64%' },
 *     { label: 'NET', value: 'OFF' },
 *     { label: 'REC', blink: true },
 *   ]}
 * />
 */
export function TopBar({ brandName = 'KIRUKAL', version, statusItems = [], children }: TopBarProps) {
    return (
        <header
            style={{
                gridColumn: '1 / -1',
                borderBottom: '2px solid var(--color-border-strong)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                padding: '0 24px',
                backgroundColor: 'var(--color-bg)',
                textTransform: 'uppercase',
                letterSpacing: '-1px',
                height: 'var(--top-bar-height, 60px)',
            }}
        >
            {/* Brand */}
            <div
                style={{
                    fontFamily: 'var(--font-display)',
                    fontSize: '2rem',
                    letterSpacing: '-2px',
                    color: 'var(--color-fg)',
                    mixBlendMode: 'difference',
                    lineHeight: 1,
                }}
            >
                {brandName}
                {version && (
                    <span
                        style={{
                            fontSize: '0.5em',
                            verticalAlign: 'middle',
                            fontFamily: 'var(--font-mono)',
                            marginLeft: '0.4em',
                        }}
                    >
                        v.{version}
                    </span>
                )}
            </div>

            {/* Status items */}
            <div
                style={{
                    display: 'flex',
                    gap: '1rem',
                    fontSize: '0.75rem',
                    color: 'var(--color-muted)',
                    fontFamily: 'var(--font-mono)',
                }}
            >
                {statusItems.map((item) => (
                    <span key={item.label}>
                        {item.label}
                        {item.value && `: ${item.value}`}
                        {item.blink && (
                            <>
                                {' '}
                                <span className="raw-blink">●</span>
                            </>
                        )}
                    </span>
                ))}
                {children}
            </div>
        </header>
    );
}
