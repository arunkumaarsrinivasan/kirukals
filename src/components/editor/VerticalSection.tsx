'use client';

import React, { useState, useRef, useCallback, useEffect } from 'react';
import type { SectionBlock } from '@/types/blocks';
import { useEditorStore } from '@/store/editor';
import { SectionElement } from '../sections/SectionBlock';

interface Props {
    block: SectionBlock;
}

export function VerticalSection({ block }: Props) {
    const { selectedBlockId, selectBlock, resizeBlock, theme, sketchSettings } = useEditorStore();
    const isSelected = selectedBlockId === block.id;
    const [isHovered, setIsHovered] = useState(false);
    const [isResizing, setIsResizing] = useState(false);
    const containerRef = useRef<HTMLDivElement>(null);
    const resizeStart = useRef({ y: 0, height: 0 });

    const borderColor = theme === 'dark' ? 'rgba(139, 92, 246, 0.5)' : 'rgba(124, 58, 237, 0.5)';
    const borderColorHover = theme === 'dark' ? 'rgba(139, 92, 246, 0.3)' : 'rgba(124, 58, 237, 0.3)';

    // Section background - use custom color or fallback to theme default
    const sectionBgColor = block.backgroundColor || (theme === 'dark' ? '#0a0a0b' : '#f4f4f5');

    const handleClick = useCallback((e: React.MouseEvent) => {
        e.stopPropagation();
        selectBlock(block.id);
    }, [block.id, selectBlock]);

    const handleResizeStart = useCallback((e: React.MouseEvent) => {
        e.preventDefault();
        e.stopPropagation();
        setIsResizing(true);
        resizeStart.current = {
            y: e.clientY,
            height: block.height,
        };
    }, [block.height]);

    useEffect(() => {
        if (!isResizing) return;

        const handleMouseMove = (e: MouseEvent) => {
            const dy = e.clientY - resizeStart.current.y;
            const newHeight = Math.max(100, resizeStart.current.height + dy);
            resizeBlock(block.id, block.width, newHeight);
        };

        const handleMouseUp = () => {
            setIsResizing(false);
        };

        window.addEventListener('mousemove', handleMouseMove);
        window.addEventListener('mouseup', handleMouseUp);
        return () => {
            window.removeEventListener('mousemove', handleMouseMove);
            window.removeEventListener('mouseup', handleMouseUp);
        };
    }, [isResizing, block.id, block.width, resizeBlock]);

    return (
        <div
            ref={containerRef}
            data-block-id={block.id}
            className="relative w-full group"
            style={{
                height: block.height,
                backgroundColor: sectionBgColor
            }}
            onMouseEnter={() => setIsHovered(true)}
            onMouseLeave={() => setIsHovered(false)}
            onClick={handleClick}
        >
            {/* Border overlay */}
            <div
                className="absolute inset-0 pointer-events-none transition-all duration-150"
                style={{
                    border: `2px solid ${isSelected ? borderColor : isHovered ? borderColorHover : 'transparent'}`,
                    boxShadow: isSelected ? `0 0 20px ${borderColorHover}` : 'none'
                }}
            />

            {/* Section Label Badge */}
            {block.label && (
                <div
                    className="absolute top-2 left-4 px-2 py-0.5 text-xs font-medium rounded"
                    style={{
                        backgroundColor: theme === 'dark' ? 'rgba(139, 92, 246, 0.2)' : 'rgba(124, 58, 237, 0.1)',
                        color: theme === 'dark' ? '#a78bfa' : '#7c3aed'
                    }}
                >
                    {block.label}
                </div>
            )}

            {/* Content */}
            <div className="w-full h-full">
                <SectionElement block={block} globalSettings={sketchSettings} />
            </div>

            {/* Height indicator */}
            {(isSelected || isHovered) && (
                <div
                    className="absolute right-4 top-1/2 -translate-y-1/2 px-2 py-1 rounded text-[10px] font-mono"
                    style={{
                        backgroundColor: theme === 'dark' ? '#18181b' : '#fff',
                        color: theme === 'dark' ? '#8b5cf6' : '#7c3aed',
                        border: `1px solid ${borderColorHover}`
                    }}
                >
                    {block.height}px
                </div>
            )}

            {/* Type badge */}
            <div
                className={`absolute -top-6 left-4 px-2 py-0.5 text-[10px] uppercase tracking-wider rounded transition-opacity ${isSelected || isHovered ? 'opacity-100' : 'opacity-0'}`}
                style={{
                    backgroundColor: theme === 'dark' ? '#27272a' : '#e4e4e7',
                    color: theme === 'dark' ? '#a1a1aa' : '#52525b'
                }}
            >
                Section
            </div>

            {/* Bottom resize handle */}
            {(isSelected || isHovered) && (
                <div
                    className="absolute bottom-0 left-0 right-0 h-2 cursor-ns-resize group/resize"
                    onMouseDown={handleResizeStart}
                >
                    {/* Visual handle */}
                    <div
                        className="absolute bottom-1 left-1/2 -translate-x-1/2 w-20 h-1 rounded-full transition-all"
                        style={{
                            backgroundColor: isSelected ? borderColor : borderColorHover,
                        }}
                    />
                </div>
            )}

            {/* Delete button */}
            {isSelected && (
                <button
                    onClick={(e) => {
                        e.stopPropagation();
                        useEditorStore.getState().deleteBlock(block.id);
                    }}
                    className="absolute top-2 right-2 w-6 h-6 rounded-full flex items-center justify-center transition-colors hover:bg-red-500/20"
                    style={{
                        backgroundColor: theme === 'dark' ? '#27272a' : '#e4e4e7',
                        color: theme === 'dark' ? '#f87171' : '#dc2626'
                    }}
                >
                    <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                    </svg>
                </button>
            )}
        </div>
    );
}
