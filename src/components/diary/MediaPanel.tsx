'use client';

import { motion } from 'framer-motion';
import type { MediaItem } from '@/types/database';

interface MediaPanelProps {
    side: 'left' | 'right';
    items: MediaItem[];
    activeMediaId?: string | null;
    onAddItem?: () => void;
}

export function MediaPanel({ side, items, activeMediaId, onAddItem }: MediaPanelProps) {
    const sketches = items.filter((m) => m.type === 'image' || m.type === 'sketch' || m.type === 'sketch_component');
    const links = items.filter((m) => m.type === 'link');
    const videos = items.filter((m) => m.type === 'video' || m.type === 'embed');

    return (
        <div className={`flex flex-col gap-4 ${side === 'left' ? 'items-end' : 'items-start'}`}>

            {/* Sketches / Images section */}
            {(sketches.length > 0 || side === 'left') && (
                <div className="w-full">
                    <p className="text-xs text-zinc-600 uppercase tracking-widest mb-2 px-1">
                        {side === 'left' ? '✏️ Sketches' : '🔗 Links'}
                    </p>
                    <div className="flex flex-col gap-3">
                        {(side === 'left' ? sketches : links).map((item) => (
                            <MediaCard key={item.id} item={item} active={activeMediaId === item.id} side={side} />
                        ))}
                    </div>
                </div>
            )}

            {/* Videos / Embeds section (right panel) */}
            {side === 'right' && videos.length > 0 && (
                <div className="w-full">
                    <p className="text-xs text-zinc-600 uppercase tracking-widest mb-2 px-1">🎬 Videos</p>
                    <div className="flex flex-col gap-3">
                        {videos.map((item) => (
                            <MediaCard key={item.id} item={item} active={activeMediaId === item.id} side={side} />
                        ))}
                    </div>
                </div>
            )}

            {/* Right: show sketches on right if no left panel is available */}
            {side === 'right' && sketches.length > 0 && (
                <div className="w-full">
                    <p className="text-xs text-zinc-600 uppercase tracking-widest mb-2 px-1">🖼 Images</p>
                    <div className="flex flex-col gap-3">
                        {sketches.map((item) => (
                            <MediaCard key={item.id} item={item} active={activeMediaId === item.id} side={side} />
                        ))}
                    </div>
                </div>
            )}

            {/* Add button */}
            {onAddItem && (
                <button
                    onClick={onAddItem}
                    className="w-full py-3 rounded-xl border-2 border-dashed border-zinc-800 hover:border-violet-500/50 hover:bg-violet-500/5 text-zinc-600 hover:text-violet-400 text-xs transition-all"
                >
                    + Add media
                </button>
            )}

            {items.length === 0 && (
                <div className="w-full py-8 rounded-xl border border-zinc-800/50 flex flex-col items-center gap-2 opacity-40">
                    <span className="text-2xl">{side === 'left' ? '✏️' : '🔗'}</span>
                    <p className="text-xs text-zinc-600">
                        {side === 'left' ? 'Sketches & images' : 'Links & videos'}
                    </p>
                </div>
            )}
        </div>
    );
}

// ─── Individual media card ────────────────────────────────────────────────────

function MediaCard({ item, active, side }: { item: MediaItem; active: boolean; side: 'left' | 'right' }) {
    return (
        <motion.a
            href={item.url}
            target="_blank"
            rel="noopener noreferrer"
            data-media-id={item.id}
            layout
            whileHover={{ scale: 1.02, y: -2 }}
            className={`
        block rounded-xl overflow-hidden border transition-all duration-200 cursor-pointer
        ${active
                    ? 'border-violet-500 shadow-lg shadow-violet-500/20 ring-1 ring-violet-500/50'
                    : 'border-zinc-800 hover:border-zinc-600'
                }
        bg-zinc-900
      `}
        >
            {/* Thumbnail */}
            {(item.thumbnail_url || item.type === 'image' || item.type === 'sketch' || item.type === 'sketch_component') && (
                <div className="relative overflow-hidden">
                    <img
                        src={item.thumbnail_url ?? item.url}
                        alt={item.title ?? ''}
                        className="w-full h-32 object-contain bg-zinc-800 transition-transform duration-300 group-hover:scale-105"
                    />
                    {/* Polaroid caption strip */}
                    {item.type === 'sketch' || item.type === 'sketch_component' ? (
                        <div className="absolute bottom-0 inset-x-0 bg-gradient-to-t from-black/60 to-transparent py-2 px-2">
                            <p className="text-white text-[10px] font-medium truncate">{item.title}</p>
                        </div>
                    ) : null}
                    {/* Active glow */}
                    {active && (
                        <motion.div
                            initial={{ opacity: 0 }} animate={{ opacity: 1 }}
                            className="absolute inset-0 bg-violet-500/10 pointer-events-none"
                        />
                    )}
                </div>
            )}

            {/* Text content for links / embeds */}
            {!item.thumbnail_url && item.type !== 'image' && item.type !== 'sketch' && item.type !== 'sketch_component' && (
                <div className="p-3 flex items-center gap-2">
                    <div className="w-8 h-8 rounded-lg bg-zinc-800 flex items-center justify-center shrink-0 text-lg">
                        {item.type === 'video' ? '🎬' : item.type === 'embed' ? '🔲' : '🔗'}
                    </div>
                    <div className="min-w-0">
                        <p className="text-white text-xs font-medium truncate">{item.title ?? item.url}</p>
                        {item.type === 'link' && (
                            <p className="text-zinc-600 text-[10px] truncate">
                                {(() => { try { return new URL(item.url).hostname; } catch { return item.url; } })()}
                            </p>
                        )}
                    </div>
                </div>
            )}
        </motion.a>
    );
}
