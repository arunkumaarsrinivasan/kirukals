'use client';

import { useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import type { MediaItem } from '@/types/database';

interface HoverMediaPreviewProps {
    media: MediaItem | null;
    anchorRect?: DOMRect;
    side: 'left' | 'right';
}

export function HoverMediaPreview({ media, anchorRect, side }: HoverMediaPreviewProps) {
    const ref = useRef<HTMLDivElement>(null);

    // Position: vertically aligned with anchor, offset to the side
    const style: React.CSSProperties = anchorRect
        ? {
            position: 'fixed',
            top: Math.max(8, anchorRect.top - 20),
            [side === 'left' ? 'right' : 'left']: side === 'left'
                ? window.innerWidth - anchorRect.left + 12
                : anchorRect.right + 12,
            zIndex: 100,
        }
        : { position: 'fixed', opacity: 0, zIndex: 100 };

    return (
        <AnimatePresence>
            {media && (
                <motion.div
                    ref={ref}
                    key={media.id}
                    style={style}
                    initial={{ opacity: 0, x: side === 'left' ? 12 : -12, scale: 0.95 }}
                    animate={{ opacity: 1, x: 0, scale: 1 }}
                    exit={{ opacity: 0, x: side === 'left' ? 12 : -12, scale: 0.95 }}
                    transition={{ duration: 0.18, ease: 'easeOut' }}
                    className="w-60 rounded-xl shadow-2xl shadow-black/50 overflow-hidden bg-zinc-900 border border-zinc-700"
                >
                    {/* Thumbnail */}
                    {(media.thumbnail_url || media.type === 'image') && (
                        <div className="relative w-full h-36 bg-zinc-800">
                            <img
                                src={media.thumbnail_url ?? media.url}
                                alt={media.title ?? ''}
                                className="w-full h-full object-cover"
                            />
                            {/* Type badge */}
                            <div className="absolute top-2 left-2">
                                <MediaTypeBadge type={media.type} />
                            </div>
                        </div>
                    )}

                    {/* For non-image types without thumbnail */}
                    {!media.thumbnail_url && media.type !== 'image' && (
                        <div className="flex items-center justify-center h-20 bg-zinc-800">
                            <MediaTypeIcon type={media.type} className="w-8 h-8 text-zinc-500" />
                        </div>
                    )}

                    {/* Info */}
                    <div className="p-3">
                        <p className="text-white text-sm font-medium leading-snug line-clamp-2">
                            {media.title ?? media.url}
                        </p>
                        {media.description && (
                            <p className="text-zinc-400 text-xs mt-1 line-clamp-2">{media.description}</p>
                        )}
                        {media.type === 'link' && (
                            <p className="text-zinc-600 text-xs mt-1.5 truncate">{new URL(media.url).hostname}</p>
                        )}
                    </div>

                    {/* Connector arrow pointing to anchor side */}
                    <div
                        className={`absolute top-8 ${side === 'left' ? '-right-2' : '-left-2'} w-0 h-0`}
                        style={{
                            borderTop: '6px solid transparent',
                            borderBottom: '6px solid transparent',
                            [side === 'left' ? 'borderLeft' : 'borderRight']: '8px solid rgb(63 63 70)', // zinc-700
                        }}
                    />
                </motion.div>
            )}
        </AnimatePresence>
    );
}

function MediaTypeBadge({ type }: { type: string }) {
    const labels: Record<string, { label: string; color: string }> = {
        image: { label: 'Image', color: 'bg-emerald-500' },
        sketch: { label: 'Sketch', color: 'bg-amber-500' },
        sketch_component: { label: 'Sketch', color: 'bg-amber-500' },
        video: { label: 'Video', color: 'bg-red-500' },
        link: { label: 'Link', color: 'bg-blue-500' },
        embed: { label: 'Embed', color: 'bg-violet-500' },
    };
    const meta = labels[type] ?? { label: type, color: 'bg-zinc-600' };
    return (
        <span className={`${meta.color} text-white text-[10px] font-bold uppercase tracking-wider px-1.5 py-0.5 rounded-md`}>
            {meta.label}
        </span>
    );
}

function MediaTypeIcon({ type, className }: { type: string; className: string }) {
    const icons: Record<string, string> = {
        video: 'M14.752 11.168l-3.197-2.132A1 1 0 0010 9.87v4.263a1 1 0 001.555.832l3.197-2.132a1 1 0 000-1.664z M21 12a9 9 0 11-18 0 9 9 0 0118 0z',
        link: 'M13.828 10.172a4 4 0 00-5.656 0l-4 4a4 4 0 105.656 5.656l1.102-1.101m0 0l1-1m3.142 3.142l-1-1m1.058-4.142a4 4 0 005.656 0l4-4a4 4 0 00-5.656-5.656l-1.1 1.1',
        embed: 'M10 20l4-16m4 4l4 4-4 4M6 16l-4-4 4-4',
    };
    const d = icons[type] ?? 'M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z';
    return (
        <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d={d} />
        </svg>
    );
}
