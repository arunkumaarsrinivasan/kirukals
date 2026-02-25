'use client';

import { useEffect, useRef } from 'react';
import { motion } from 'framer-motion';
import type { ConnectionWithMedia } from '@/hooks/useConnections';

interface ConnectionOverlayProps {
    connections: ConnectionWithMedia[];
    activeConnectionId?: string | null;
}

/**
 * SVG overlay that draws animated arcs between diary text spans
 * and their connected media items in the surround panels.
 * Uses data-media-id attributes to find media card DOM positions.
 */
export function ConnectionOverlay({ connections, activeConnectionId }: ConnectionOverlayProps) {
    const svgRef = useRef<SVGSVGElement>(null);

    useEffect(() => {
        // Force re-render when active connection changes
    }, [activeConnectionId]);

    if (!activeConnectionId) return null;

    const activeConn = connections.find((c) => c.id === activeConnectionId);
    if (!activeConn) return null;

    // Find the media card element
    const mediaCard = document.querySelector(`[data-media-id="${activeConn.media_id}"]`);
    const textSpan = document.querySelector(`[data-connection-id="${activeConn.id}"]`);

    if (!mediaCard || !textSpan) return null;

    const mediaRect = mediaCard.getBoundingClientRect();
    const textRect = textSpan.getBoundingClientRect();

    const side = activeConn.position_hint ?? (mediaRect.right < textRect.left ? 'left' : 'right');

    // Calculate arc start and end
    const startX = side === 'left' ? textRect.left : textRect.right;
    const startY = textRect.top + textRect.height / 2;
    const endX = side === 'left' ? mediaRect.right : mediaRect.left;
    const endY = mediaRect.top + mediaRect.height / 2;

    const cpX = (startX + endX) / 2;
    const cpY = Math.min(startY, endY) - 40;

    const d = `M${startX},${startY} Q${cpX},${cpY} ${endX},${endY}`;

    return (
        <svg
            ref={svgRef}
            className="fixed inset-0 pointer-events-none"
            style={{ width: '100vw', height: '100vh', zIndex: 50 }}
        >
            <defs>
                <linearGradient id="connGrad" x1="0%" y1="0%" x2="100%" y2="0%">
                    <stop offset="0%" stopColor="rgba(139,92,246,0.8)" />
                    <stop offset="100%" stopColor="rgba(236,72,153,0.8)" />
                </linearGradient>
            </defs>

            <motion.path
                d={d}
                fill="none"
                stroke="url(#connGrad)"
                strokeWidth="2"
                strokeDasharray="4 3"
                initial={{ pathLength: 0, opacity: 0 }}
                animate={{ pathLength: 1, opacity: 1 }}
                exit={{ pathLength: 0, opacity: 0 }}
                transition={{ duration: 0.3, ease: 'easeOut' }}
            />

            {/* Dot at media end */}
            <motion.circle
                cx={endX} cy={endY} r={4}
                fill="rgba(236,72,153,0.8)"
                initial={{ scale: 0 }} animate={{ scale: 1 }} exit={{ scale: 0 }}
            />
        </svg>
    );
}
