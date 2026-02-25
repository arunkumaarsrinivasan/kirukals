'use client';

import React, { useState, useRef, useCallback, useEffect } from 'react';
import type { Block } from '@/types/blocks';
import { useEditorStore } from '@/store/editor';

interface Props {
    block: Block;
    children: React.ReactNode;
    onDoubleClick?: () => void;
}

export function DraggableBlock({ block, children, onDoubleClick }: Props) {
    const { selectedBlockId, selectBlock, moveBlock, resizeBlock, bringToFront, theme } = useEditorStore();
    const isSelected = selectedBlockId === block.id;
    const [isHovered, setIsHovered] = useState(false);
    const [dimensions, setDimensions] = useState({ width: 0, height: 0 });
    const containerRef = useRef<HTMLDivElement>(null);

    // Drag state
    const [isDragging, setIsDragging] = useState(false);
    const [isResizing, setIsResizing] = useState<string | null>(null);
    const dragStart = useRef({ x: 0, y: 0, blockX: 0, blockY: 0, blockW: 0, blockH: 0 });

    // Measure dimensions
    useEffect(() => {
        if (containerRef.current) {
            const resizeObserver = new ResizeObserver((entries) => {
                for (const entry of entries) {
                    setDimensions({
                        width: Math.round(entry.contentRect.width),
                        height: Math.round(entry.contentRect.height)
                    });
                }
            });
            resizeObserver.observe(containerRef.current);
            return () => resizeObserver.disconnect();
        }
    }, []);

    const handleMouseDown = useCallback((e: React.MouseEvent) => {
        if ((e.target as HTMLElement).dataset.resize) return;
        e.preventDefault();
        e.stopPropagation();
        selectBlock(block.id);
        bringToFront(block.id);
        setIsDragging(true);
        dragStart.current = {
            x: e.clientX,
            y: e.clientY,
            blockX: block.x,
            blockY: block.y,
            blockW: block.width,
            blockH: block.height,
        };
    }, [block, selectBlock, bringToFront]);

    const handleResizeStart = useCallback((e: React.MouseEvent, handle: string) => {
        e.preventDefault();
        e.stopPropagation();
        selectBlock(block.id);
        setIsResizing(handle);
        dragStart.current = {
            x: e.clientX,
            y: e.clientY,
            blockX: block.x,
            blockY: block.y,
            blockW: block.width,
            blockH: block.height,
        };
    }, [block, selectBlock]);

    useEffect(() => {
        if (!isDragging && !isResizing) return;

        const handleMouseMove = (e: MouseEvent) => {
            const dx = e.clientX - dragStart.current.x;
            const dy = e.clientY - dragStart.current.y;

            if (isDragging) {
                moveBlock(block.id, dragStart.current.blockX + dx, dragStart.current.blockY + dy);
            } else if (isResizing) {
                let newW = dragStart.current.blockW;
                let newH = dragStart.current.blockH;
                let newX = dragStart.current.blockX;
                let newY = dragStart.current.blockY;

                if (isResizing.includes('e')) newW += dx;
                if (isResizing.includes('w')) { newW -= dx; newX += dx; }
                if (isResizing.includes('s')) newH += dy;
                if (isResizing.includes('n')) { newH -= dy; newY += dy; }

                resizeBlock(block.id, Math.max(100, newW), Math.max(50, newH));
                if (isResizing.includes('w') || isResizing.includes('n')) {
                    moveBlock(block.id, newX, newY);
                }
            }
        };

        const handleMouseUp = () => {
            setIsDragging(false);
            setIsResizing(null);
        };

        window.addEventListener('mousemove', handleMouseMove);
        window.addEventListener('mouseup', handleMouseUp);
        return () => {
            window.removeEventListener('mousemove', handleMouseMove);
            window.removeEventListener('mouseup', handleMouseUp);
        };
    }, [isDragging, isResizing, block.id, moveBlock, resizeBlock]);

    const borderColor = theme === 'dark' ? 'rgba(139, 92, 246, 0.5)' : 'rgba(124, 58, 237, 0.5)';
    const borderColorHover = theme === 'dark' ? 'rgba(139, 92, 246, 0.3)' : 'rgba(124, 58, 237, 0.3)';

    return (
        <>
            {/* Wireframe hover effect - extends to viewport edges */}
            {isHovered && (
                <>
                    {/* Vertical lines */}
                    <div className="fixed inset-0 pointer-events-none z-40">
                        <div className="absolute w-px" style={{
                            left: containerRef.current?.getBoundingClientRect().left ?? 0,
                            top: 0,
                            height: containerRef.current?.getBoundingClientRect().top ?? 0,
                            backgroundColor: borderColorHover
                        }} />
                        <div className="absolute w-px" style={{
                            left: (containerRef.current?.getBoundingClientRect().right ?? 0) - 1,
                            top: 0,
                            height: containerRef.current?.getBoundingClientRect().top ?? 0,
                            backgroundColor: borderColorHover
                        }} />
                        <div className="absolute w-px" style={{
                            left: containerRef.current?.getBoundingClientRect().left ?? 0,
                            top: containerRef.current?.getBoundingClientRect().bottom ?? 0,
                            bottom: 0,
                            backgroundColor: borderColorHover
                        }} />
                        <div className="absolute w-px" style={{
                            left: (containerRef.current?.getBoundingClientRect().right ?? 0) - 1,
                            top: containerRef.current?.getBoundingClientRect().bottom ?? 0,
                            bottom: 0,
                            backgroundColor: borderColorHover
                        }} />
                    </div>
                    {/* Horizontal lines */}
                    <div className="fixed inset-0 pointer-events-none z-40">
                        <div className="absolute h-px" style={{
                            top: containerRef.current?.getBoundingClientRect().top ?? 0,
                            left: 0,
                            width: containerRef.current?.getBoundingClientRect().left ?? 0,
                            backgroundColor: borderColorHover
                        }} />
                        <div className="absolute h-px" style={{
                            top: (containerRef.current?.getBoundingClientRect().bottom ?? 0) - 1,
                            left: 0,
                            width: containerRef.current?.getBoundingClientRect().left ?? 0,
                            backgroundColor: borderColorHover
                        }} />
                        <div className="absolute h-px" style={{
                            top: containerRef.current?.getBoundingClientRect().top ?? 0,
                            left: containerRef.current?.getBoundingClientRect().right ?? 0,
                            right: 0,
                            backgroundColor: borderColorHover
                        }} />
                        <div className="absolute h-px" style={{
                            top: (containerRef.current?.getBoundingClientRect().bottom ?? 0) - 1,
                            left: containerRef.current?.getBoundingClientRect().right ?? 0,
                            right: 0,
                            backgroundColor: borderColorHover
                        }} />
                        {/* Dimension labels */}
                        <div className="absolute px-2 py-0.5 rounded text-[9px] font-mono" style={{
                            top: ((containerRef.current?.getBoundingClientRect().top ?? 0) + (containerRef.current?.getBoundingClientRect().bottom ?? 0)) / 2,
                            left: 8,
                            transform: 'translateY(-50%)',
                            backgroundColor: theme === 'dark' ? '#18181b' : '#fff',
                            color: theme === 'dark' ? '#8b5cf6' : '#7c3aed',
                            border: `1px solid ${borderColorHover}`
                        }}>
                            {dimensions.height}px
                        </div>
                        <div className="absolute px-2 py-0.5 rounded text-[9px] font-mono" style={{
                            top: ((containerRef.current?.getBoundingClientRect().top ?? 0) + (containerRef.current?.getBoundingClientRect().bottom ?? 0)) / 2,
                            right: 8,
                            transform: 'translateY(-50%)',
                            backgroundColor: theme === 'dark' ? '#18181b' : '#fff',
                            color: theme === 'dark' ? '#8b5cf6' : '#7c3aed',
                            border: `1px solid ${borderColorHover}`
                        }}>
                            {dimensions.width}px
                        </div>
                    </div>
                </>
            )}

            <div
                ref={containerRef}
                data-block-id={block.id}
                className={`absolute group cursor-move ${isDragging ? 'cursor-grabbing' : ''}`}
                style={{
                    left: block.x,
                    top: block.y,
                    width: block.width,
                    height: block.height,
                    zIndex: block.zIndex,
                }}
                onMouseEnter={() => setIsHovered(true)}
                onMouseLeave={() => setIsHovered(false)}
                onMouseDown={handleMouseDown}
                onDoubleClick={onDoubleClick}
            >
                {/* Border */}
                <div
                    className={`absolute inset-0 rounded-lg pointer-events-none transition-all duration-150`}
                    style={{
                        border: `2px solid ${isSelected ? borderColor : isHovered ? borderColorHover : 'transparent'}`,
                        boxShadow: isSelected ? `0 0 20px ${borderColorHover}` : 'none'
                    }}
                />

                {/* Content */}
                <div className="w-full h-full overflow-hidden rounded-lg">
                    {children}
                </div>

                {/* Resize handles - only show when selected */}
                {isSelected && (
                    <>
                        {/* Corner handles */}
                        {['nw', 'ne', 'sw', 'se'].map((handle) => (
                            <div
                                key={handle}
                                data-resize={handle}
                                className="absolute w-3 h-3 bg-violet-500 rounded-sm cursor-nwse-resize z-10"
                                style={{
                                    top: handle.includes('n') ? -6 : undefined,
                                    bottom: handle.includes('s') ? -6 : undefined,
                                    left: handle.includes('w') ? -6 : undefined,
                                    right: handle.includes('e') ? -6 : undefined,
                                    cursor: handle === 'nw' || handle === 'se' ? 'nwse-resize' : 'nesw-resize',
                                }}
                                onMouseDown={(e) => handleResizeStart(e, handle)}
                            />
                        ))}
                        {/* Edge handles */}
                        {['n', 's', 'e', 'w'].map((handle) => (
                            <div
                                key={handle}
                                data-resize={handle}
                                className="absolute bg-violet-500/50 z-10"
                                style={{
                                    top: handle === 'n' ? -3 : handle === 's' ? undefined : 6,
                                    bottom: handle === 's' ? -3 : handle === 'n' ? undefined : 6,
                                    left: handle === 'w' ? -3 : handle === 'e' ? undefined : 6,
                                    right: handle === 'e' ? -3 : handle === 'w' ? undefined : 6,
                                    width: handle === 'n' || handle === 's' ? 'calc(100% - 12px)' : 6,
                                    height: handle === 'e' || handle === 'w' ? 'calc(100% - 12px)' : 6,
                                    cursor: handle === 'n' || handle === 's' ? 'ns-resize' : 'ew-resize',
                                    borderRadius: 2,
                                }}
                                onMouseDown={(e) => handleResizeStart(e, handle)}
                            />
                        ))}
                    </>
                )}

                {/* Type badge */}
                <div
                    className={`absolute -top-6 left-0 px-2 py-0.5 text-[10px] uppercase tracking-wider rounded transition-opacity ${isSelected || isHovered ? 'opacity-100' : 'opacity-0'}`}
                    style={{
                        backgroundColor: theme === 'dark' ? '#27272a' : '#e4e4e7',
                        color: theme === 'dark' ? '#a1a1aa' : '#52525b'
                    }}
                >
                    {block.type}
                </div>
            </div>
        </>
    );
}
