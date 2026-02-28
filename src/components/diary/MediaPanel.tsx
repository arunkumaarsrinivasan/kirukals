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
        <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>

            {/* Section header */}
            <div style={{
                padding: '8px 12px',
                borderBottom: '1px solid var(--color-border-strong)',
                borderTop: '1px solid var(--color-border-strong)',
                fontSize: '0.6rem',
                fontFamily: 'var(--font-mono)',
                textTransform: 'uppercase',
                letterSpacing: '2px',
                color: 'var(--color-muted)',
                display: 'flex',
                justifyContent: 'space-between',
            }}>
                <span>{side === 'left' ? '✏️ SKETCHES' : '🔗 LINKS'}</span>
                <span>[{items.length.toString().padStart(3, '0')}]</span>
            </div>

            {/* Sketches (left) */}
            {side === 'left' && (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                    {sketches.map((item) => (
                        <MediaCard key={item.id} item={item} active={activeMediaId === item.id} side={side} />
                    ))}
                </div>
            )}

            {/* Links (right) */}
            {side === 'right' && (
                <>
                    {links.length > 0 && (
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                            {links.map((item) => (
                                <MediaCard key={item.id} item={item} active={activeMediaId === item.id} side={side} />
                            ))}
                        </div>
                    )}
                    {videos.length > 0 && (
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', marginTop: '8px' }}>
                            <div style={{ fontSize: '0.6rem', fontFamily: 'var(--font-mono)', color: 'var(--color-muted)', textTransform: 'uppercase', letterSpacing: '2px', paddingLeft: '4px' }}>
                                🎬 VIDEOS
                            </div>
                            {videos.map((item) => (
                                <MediaCard key={item.id} item={item} active={activeMediaId === item.id} side={side} />
                            ))}
                        </div>
                    )}
                    {sketches.length > 0 && (
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', marginTop: '8px' }}>
                            <div style={{ fontSize: '0.6rem', fontFamily: 'var(--font-mono)', color: 'var(--color-muted)', textTransform: 'uppercase', letterSpacing: '2px', paddingLeft: '4px' }}>
                                🖼 IMAGES
                            </div>
                            {sketches.map((item) => (
                                <MediaCard key={item.id} item={item} active={activeMediaId === item.id} side={side} />
                            ))}
                        </div>
                    )}
                </>
            )}

            {/* Add button */}
            {onAddItem && (
                <button
                    onClick={onAddItem}
                    style={{
                        width: '100%', padding: '12px',
                        border: '1px dashed var(--color-border)',
                        backgroundColor: 'transparent',
                        color: 'var(--color-subtle)',
                        fontFamily: 'var(--font-mono)',
                        fontSize: '0.65rem',
                        textTransform: 'uppercase',
                        letterSpacing: '1px',
                        transition: 'all 0.1s',
                    }}
                    onMouseEnter={(e) => {
                        (e.currentTarget as HTMLElement).style.borderColor = 'var(--color-border-strong)';
                        (e.currentTarget as HTMLElement).style.color = 'var(--color-fg)';
                    }}
                    onMouseLeave={(e) => {
                        (e.currentTarget as HTMLElement).style.borderColor = 'var(--color-border)';
                        (e.currentTarget as HTMLElement).style.color = 'var(--color-subtle)';
                    }}
                >
                    + ADD MEDIA
                </button>
            )}

            {/* Empty state */}
            {items.length === 0 && (
                <div style={{
                    padding: '32px 16px',
                    border: '1px dashed var(--color-border)',
                    display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '8px',
                    opacity: 0.4,
                }}>
                    <span style={{ fontSize: '1.5rem' }}>{side === 'left' ? '✏️' : '🔗'}</span>
                    <p style={{ fontSize: '0.6rem', fontFamily: 'var(--font-mono)', color: 'var(--color-subtle)', textTransform: 'uppercase', letterSpacing: '1px' }}>
                        {side === 'left' ? 'SKETCHES & IMAGES' : 'LINKS & VIDEOS'}
                    </p>
                </div>
            )}
        </div>
    );
}

// ─── Media Card ────────────────────────────────────────────────────────────────

function MediaCard({ item, active, side }: { item: MediaItem; active: boolean; side: 'left' | 'right' }) {
    const isVisual = item.thumbnail_url || item.type === 'image' || item.type === 'sketch' || item.type === 'sketch_component';

    return (
        <motion.a
            href={item.url}
            target="_blank"
            rel="noopener noreferrer"
            data-media-id={item.id}
            layout
            whileHover={{ scale: 1.01 }}
            style={{
                display: 'block',
                overflow: 'hidden',
                border: active
                    ? '2px solid var(--color-border-strong)'
                    : '1px solid var(--color-border)',
                borderLeft: `4px solid ${active ? 'var(--color-accent)' : 'var(--color-border)'}`,
                backgroundColor: 'var(--color-surface)',
                textDecoration: 'none',
                transition: 'border-color 0.1s linear',
            }}
        >
            {/* Image thumbnail */}
            {isVisual && (
                <div style={{ position: 'relative', overflow: 'hidden' }}>
                    <img
                        src={item.thumbnail_url ?? item.url}
                        alt={item.title ?? ''}
                        style={{
                            width: '100%', height: '128px', objectFit: 'contain',
                            backgroundColor: 'var(--color-canvas)',
                            filter: 'grayscale(10%)',
                            display: 'block',
                        }}
                    />
                    {(item.type === 'sketch' || item.type === 'sketch_component') && item.title && (
                        <div style={{
                            position: 'absolute', bottom: 0, left: 0, right: 0,
                            padding: '4px 8px',
                            backgroundColor: 'rgba(8,8,8,0.8)',
                            borderTop: '1px solid var(--color-border)',
                        }}>
                            <p style={{ color: 'var(--color-fg)', fontSize: '0.6rem', fontFamily: 'var(--font-mono)', textTransform: 'uppercase', letterSpacing: '0.5px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                                {item.title}
                            </p>
                        </div>
                    )}
                    {active && (
                        <motion.div
                            initial={{ opacity: 0 }} animate={{ opacity: 1 }}
                            style={{ position: 'absolute', inset: 0, backgroundColor: 'rgba(255,0,60,0.05)', pointerEvents: 'none' }}
                        />
                    )}
                </div>
            )}

            {/* Link / embed */}
            {!isVisual && (
                <div style={{ padding: '12px', display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <div style={{
                        width: '28px', height: '28px', flexShrink: 0,
                        border: '1px solid var(--color-border)',
                        display: 'flex', alignItems: 'center', justifyContent: 'center',
                        fontSize: '0.9rem',
                    }}>
                        {item.type === 'video' ? '🎬' : item.type === 'embed' ? '🔲' : '🔗'}
                    </div>
                    <div style={{ minWidth: 0 }}>
                        <p style={{ color: 'var(--color-fg)', fontSize: '0.7rem', fontFamily: 'var(--font-mono)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', textTransform: 'uppercase' }}>
                            {item.title ?? item.url}
                        </p>
                        {item.type === 'link' && (
                            <p style={{ color: 'var(--color-subtle)', fontSize: '0.6rem', fontFamily: 'var(--font-mono)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                                {(() => { try { return new URL(item.url).hostname; } catch { return item.url; } })()}
                            </p>
                        )}
                    </div>
                </div>
            )}
        </motion.a>
    );
}
