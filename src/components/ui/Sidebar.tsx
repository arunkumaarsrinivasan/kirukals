'use client';

import React from 'react';

export interface SidebarItem {
    id: string | number;
    label: string;
    sublabel?: string;
}

interface SidebarProps {
    title?: string;
    items: SidebarItem[];
    activeId?: string | number;
    onSelect?: (id: string | number) => void;
    /** Content to render in the sticky footer slot of the sidebar */
    footerSlot?: React.ReactNode;
}

/**
 * Sidebar — Generic vertical list sidebar for the RAW_INPUT grid layout.
 *
 * Active and hovered items invert to light-on-dark. Uses a scrollable
 * entry list with a sticky footer slot for session info, notes, etc.
 *
 * @example
 * <Sidebar
 *   title="Index"
 *   items={entries.map(e => ({ id: e.id, label: e.title, sublabel: e.date }))}
 *   activeId={activeEntry}
 *   onSelect={setActiveEntry}
 *   footerSlot={<span>SESSION: X99</span>}
 * />
 */
export function Sidebar({ title = 'Index', items, activeId, onSelect, footerSlot }: SidebarProps) {
    return (
        <aside
            style={{
                gridRow: '2 / -1',
                borderRight: '2px solid var(--color-border-strong)',
                display: 'flex',
                flexDirection: 'column',
                backgroundColor: 'var(--color-surface)',
                overflow: 'hidden',
            }}
        >
            {/* Header */}
            <div
                style={{
                    padding: '16px',
                    borderBottom: '1px solid var(--color-border)',
                    fontWeight: 700,
                    textTransform: 'uppercase',
                    letterSpacing: '1px',
                    fontSize: '0.8rem',
                    display: 'flex',
                    justifyContent: 'space-between',
                    fontFamily: 'var(--font-mono)',
                    flexShrink: 0,
                }}
            >
                <span>{title}</span>
                <span>[{String(items.length).padStart(3, '0')}]</span>
            </div>

            {/* Scrollable list */}
            <ul
                style={{
                    listStyle: 'none',
                    padding: 0,
                    margin: 0,
                    overflowY: 'auto',
                    flex: 1,
                }}
            >
                {items.map((item) => {
                    const isActive = item.id === activeId;
                    return (
                        <li
                            key={item.id}
                            className="raw-sidebar-item"
                            onClick={() => onSelect?.(item.id)}
                            style={{
                                padding: '16px',
                                borderBottom: '1px solid var(--color-border)',
                                transition: 'all 0.1s linear',
                                cursor: 'crosshair',
                                backgroundColor: isActive ? 'var(--color-fg)' : 'transparent',
                                color: isActive ? 'var(--color-bg)' : 'var(--color-fg)',
                            }}
                        >
                            {item.sublabel && (
                                <span
                                    style={{
                                        fontSize: '0.7rem',
                                        opacity: 0.6,
                                        marginBottom: '4px',
                                        display: 'block',
                                        fontFamily: 'var(--font-mono)',
                                    }}
                                >
                                    {item.sublabel}
                                </span>
                            )}
                            <span
                                style={{
                                    fontWeight: 700,
                                    textTransform: 'uppercase',
                                    fontFamily: 'var(--font-mono)',
                                    fontSize: '0.85rem',
                                }}
                            >
                                {item.label}
                            </span>
                        </li>
                    );
                })}
            </ul>

            {/* Footer slot */}
            {footerSlot && (
                <div
                    style={{
                        padding: '16px',
                        borderTop: '1px solid var(--color-border)',
                        fontSize: '0.7rem',
                        color: 'var(--color-subtle)',
                        fontFamily: 'var(--font-mono)',
                        flexShrink: 0,
                    }}
                >
                    {footerSlot}
                </div>
            )}
        </aside>
    );
}
