'use client';

import { useState, useRef, useEffect } from 'react';
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

export function DiaryEntryCard({
    entry,
    connections,
    layoutMode,
    onHoverLink,
    onSelect,
    isSelected,
}: DiaryEntryCardProps) {
    const [hoveredConnectionId, setHoveredConnectionId] = useState<string | null>(null);

    const TYPE_COLORS: Record<string, string> = {
        diary: 'from-amber-500/20 to-orange-500/20 border-amber-500/30',
        case_study: 'from-violet-500/20 to-fuchsia-500/20 border-violet-500/30',
        sketch: 'from-emerald-500/20 to-teal-500/20 border-emerald-500/30',
        note: 'from-sky-500/20 to-blue-500/20 border-sky-500/30',
    };

    const TYPE_BADGE: Record<string, string> = {
        diary: '📓 Diary',
        case_study: '🔍 Case Study',
        sketch: '✏️ Sketch',
        note: '📌 Note',
    };

    const style = TYPE_COLORS[entry.entry_type] ?? TYPE_COLORS.diary;

    return (
        <motion.div
            layout
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            whileHover={{ y: -2 }}
            onClick={onSelect}
            className={`
        relative rounded-2xl border bg-gradient-to-br ${style}
        cursor-pointer transition-shadow duration-200
        ${isSelected ? 'ring-2 ring-violet-500 shadow-xl shadow-violet-500/10' : 'hover:shadow-lg'}
        ${layoutMode === 'double' ? 'min-h-[320px]' : ''}
      `}
        >
            {/* Paper texture overlay */}
            <div className="absolute inset-0 rounded-2xl opacity-[0.03] pointer-events-none"
                style={{
                    backgroundImage: `url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='4' height='4'%3E%3Crect x='0' y='0' width='2' height='2' fill='%23fff'/%3E%3Crect x='2' y='2' width='2' height='2' fill='%23fff'/%3E%3C/svg%3E")`
                }}
            />

            <div className="relative p-5">
                {/* Header */}
                <div className="flex items-start justify-between mb-3">
                    <div>
                        <span className="text-xs font-medium text-zinc-500 uppercase tracking-wider">
                            {TYPE_BADGE[entry.entry_type]}
                        </span>
                        {entry.title && (
                            <h3 className="text-white font-semibold text-base mt-1 leading-snug">{entry.title}</h3>
                        )}
                    </div>
                    <time className="text-xs text-zinc-600 shrink-0 ml-2">
                        {new Date(entry.created_at).toLocaleDateString('en-IN', { day: 'numeric', month: 'short' })}
                    </time>
                </div>

                {/* Page image (scanned diary page) */}
                {entry.page_image_url && (
                    <div className="mb-4 rounded-xl overflow-hidden border border-white/10">
                        <img
                            src={entry.page_image_url}
                            alt={entry.title ?? 'Diary page'}
                            className="w-full object-contain max-h-64 bg-amber-50/5"
                        />
                    </div>
                )}

                {/* Content (rich text preview) */}
                {entry.plain_text && (
                    <div className="text-sm text-zinc-300 leading-relaxed line-clamp-4 mb-3">
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
                    <div className="flex flex-wrap gap-1.5 mt-3">
                        {entry.tags.map((tag) => (
                            <span key={tag}
                                className="text-xs px-2 py-0.5 rounded-full bg-white/5 border border-white/10 text-zinc-400">
                                #{tag}
                            </span>
                        ))}
                    </div>
                )}

                {/* Connection count badge */}
                {connections.length > 0 && (
                    <div className="absolute top-4 right-4 flex items-center gap-1 text-xs text-violet-400">
                        <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13.828 10.172a4 4 0 00-5.656 0l-4 4a4 4 0 105.656 5.656l1.102-1.101" />
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M14.828 14.828a4 4 0 015.656 0l4 4a4 4 0 01-5.656 5.656l-1.102-1.101" />
                        </svg>
                        {connections.length}
                    </div>
                )}
            </div>

            {/* Hover glow line at bottom */}
            <AnimatePresence>
                {hoveredConnectionId && (
                    <motion.div
                        initial={{ scaleX: 0 }} animate={{ scaleX: 1 }} exit={{ scaleX: 0 }}
                        className="absolute bottom-0 inset-x-0 h-0.5 bg-gradient-to-r from-violet-500 via-fuchsia-500 to-pink-500 rounded-b-2xl origin-left"
                    />
                )}
            </AnimatePresence>
        </motion.div>
    );
}

// ─── LinkedText ───────────────────────────────────────────────────────────────

function LinkedText({ text, connections, onHoverLink, onHoverChange }: {
    text: string;
    connections: ConnectionWithMedia[];
    onHoverLink?: (media: MediaItem | null, anchorRect?: DOMRect) => void;
    onHoverChange?: (id: string | null) => void;
}) {
    // Build segments: split plain text around connection span_texts
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
                if (!seg.connection) {
                    return <span key={i}>{seg.text}</span>;
                }
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
            className="relative cursor-pointer text-violet-300 underline decoration-violet-500/40 decoration-dotted underline-offset-2 hover:decoration-solid hover:text-violet-200 transition-colors"
            onHoverStart={() => ref.current && onEnter(ref.current.getBoundingClientRect())}
            onHoverEnd={onLeave}
            whileHover={{ textShadow: '0 0 12px rgba(139,92,246,0.6)' }}
        >
            {text}
        </motion.span>
    );
}
