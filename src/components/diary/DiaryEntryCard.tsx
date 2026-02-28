'use client';

import { useState, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import type { DiaryEntry, MediaItem } from '@/types/database';
import type { ConnectionWithMedia } from '@/hooks/useConnections';

interface DiaryEntryCardProps {
    entry: DiaryEntry;
    connections: ConnectionWithMedia[];
    layoutMode: 'single' | 'double';
    onHoverLink?: (media: MediaItem | null, anchorRect?: DOMRect) => void;
    onSelect?: () => void;
    isSelected?: boolean;
}

const TYPE_LABEL: Record<string, string> = {
    diary: '📓 DIARY',
    case_study: '🔍 CASE_STUDY',
    sketch: '✏️ SKETCH',
    note: '📌 NOTE',
};

export function DiaryEntryCard({
    entry,
    connections,
    layoutMode,
    onHoverLink,
    onSelect,
    isSelected,
}: DiaryEntryCardProps) {
    const [hoveredConnectionId, setHoveredConnectionId] = useState<string | null>(null);

    return (
        <motion.div
            layout
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            onClick={onSelect}
            style={{
                position: 'relative',
                backgroundColor: 'var(--color-surface)',
                border: isSelected ? '2px solid var(--color-border-strong)' : '1px solid var(--color-border)',
                borderLeft: `4px solid ${isSelected ? 'var(--color-accent)' : 'var(--color-border)'}`,
                padding: '20px',
                cursor: 'crosshair',
                minHeight: layoutMode === 'double' ? '320px' : undefined,
                transition: 'border-color 0.1s linear',
            }}
        >
            {/* Header */}
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '12px' }}>
                <div>
                    <span style={{
                        fontSize: '0.6rem',
                        fontFamily: 'var(--font-mono)',
                        textTransform: 'uppercase',
                        letterSpacing: '2px',
                        color: 'var(--color-muted)',
                    }}>
                        {TYPE_LABEL[entry.entry_type] ?? TYPE_LABEL.diary}
                    </span>
                    {entry.title && (
                        <h3 style={{
                            fontFamily: 'var(--font-mono)',
                            fontSize: '0.9rem',
                            fontWeight: 700,
                            color: 'var(--color-fg)',
                            marginTop: '4px',
                            textTransform: 'uppercase',
                            letterSpacing: '0.5px',
                        }}>
                            {entry.title}
                        </h3>
                    )}
                </div>
                <time style={{
                    fontSize: '0.6rem',
                    color: 'var(--color-subtle)',
                    fontFamily: 'var(--font-mono)',
                    textTransform: 'uppercase',
                    letterSpacing: '1px',
                    flexShrink: 0,
                    marginLeft: '8px',
                }}>
                    {new Date(entry.created_at).toLocaleDateString('en-IN', { day: 'numeric', month: 'short' })}
                </time>
            </div>

            {/* Page image */}
            {entry.page_image_url && (
                <div style={{ marginBottom: '16px', border: '1px solid var(--color-border)', overflow: 'hidden' }}>
                    <img
                        src={entry.page_image_url}
                        alt={entry.title ?? 'Diary page'}
                        style={{ width: '100%', objectFit: 'contain', maxHeight: '256px', filter: 'grayscale(15%)' }}
                    />
                </div>
            )}

            {/* Content text */}
            {entry.plain_text && (
                <div style={{
                    fontSize: '0.8rem',
                    color: 'var(--color-muted)',
                    lineHeight: 1.8,
                    marginBottom: '12px',
                    fontFamily: 'var(--font-mono)',
                    display: '-webkit-box',
                    WebkitLineClamp: 4,
                    WebkitBoxOrient: 'vertical',
                    overflow: 'hidden',
                }}>
                    <LinkedText
                        text={entry.plain_text}
                        connections={connections}
                        onHoverLink={onHoverLink}
                        onHoverChange={(connId) => setHoveredConnectionId(connId)}
                    />
                </div>
            )}

            {/* Tags */}
            {entry.tags && entry.tags.length > 0 && (
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: '6px', marginTop: '12px' }}>
                    {entry.tags.map((tag) => (
                        <span key={tag}
                            style={{
                                fontSize: '0.6rem',
                                padding: '3px 8px',
                                border: '1px solid var(--color-border)',
                                color: 'var(--color-muted)',
                                fontFamily: 'var(--font-mono)',
                                textTransform: 'uppercase',
                                letterSpacing: '1px',
                            }}>
                            #{tag}
                        </span>
                    ))}
                </div>
            )}

            {/* Connection count */}
            {connections.length > 0 && (
                <div style={{
                    position: 'absolute', top: '16px', right: '16px',
                    display: 'flex', alignItems: 'center', gap: '4px',
                    fontSize: '0.6rem',
                    color: 'var(--color-accent)',
                    fontFamily: 'var(--font-mono)',
                    textTransform: 'uppercase',
                }}>
                    <svg width="10" height="10" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13.828 10.172a4 4 0 00-5.656 0l-4 4a4 4 0 105.656 5.656l1.102-1.101" />
                    </svg>
                    [{connections.length}]
                </div>
            )}

            {/* Active connection indicator — bottom bar */}
            <AnimatePresence>
                {hoveredConnectionId && (
                    <motion.div
                        initial={{ scaleX: 0 }} animate={{ scaleX: 1 }} exit={{ scaleX: 0 }}
                        style={{
                            position: 'absolute', bottom: 0, left: 0, right: 0,
                            height: '3px',
                            backgroundColor: 'var(--color-accent)',
                            transformOrigin: 'left',
                        }}
                    />
                )}
            </AnimatePresence>
        </motion.div>
    );
}

// ─── LinkedText ────────────────────────────────────────────────────────────────

function LinkedText({ text, connections, onHoverLink, onHoverChange }: {
    text: string;
    connections: ConnectionWithMedia[];
    onHoverLink?: (media: MediaItem | null, anchorRect?: DOMRect) => void;
    onHoverChange?: (id: string | null) => void;
}) {
    const segments: Array<{ text: string; connection?: ConnectionWithMedia }> = [];
    let remaining = text;

    connections.forEach((conn) => {
        if (!conn.span_text) return;
        const idx = remaining.indexOf(conn.span_text);
        if (idx === -1) return;
        if (idx > 0) segments.push({ text: remaining.slice(0, idx) });
        segments.push({ text: conn.span_text, connection: conn });
        remaining = remaining.slice(idx + conn.span_text.length);
    });
    if (remaining) segments.push({ text: remaining });

    return (
        <>
            {segments.map((seg, i) => {
                if (!seg.connection) return <span key={i}>{seg.text}</span>;
                const conn = seg.connection;
                return (
                    <LinkedSpan
                        key={i}
                        text={seg.text}
                        media={conn.media_items}
                        onEnter={(rect) => {
                            onHoverLink?.(conn.media_items, rect);
                            onHoverChange?.(conn.id);
                        }}
                        onLeave={() => {
                            onHoverLink?.(null);
                            onHoverChange?.(null);
                        }}
                    />
                );
            })}
        </>
    );
}

function LinkedSpan({ text, media, onEnter, onLeave }: {
    text: string;
    media: MediaItem;
    onEnter: (rect: DOMRect) => void;
    onLeave: () => void;
}) {
    const ref = useRef<HTMLSpanElement>(null);
    return (
        <motion.span
            ref={ref}
            style={{
                color: 'var(--color-fg)',
                borderBottom: '1px solid var(--color-accent)',
                textDecorationStyle: 'dotted',
            }}
            onHoverStart={() => ref.current && onEnter(ref.current.getBoundingClientRect())}
            onHoverEnd={onLeave}
        >
            {text}
        </motion.span>
    );
}
