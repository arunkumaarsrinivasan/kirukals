'use client';

import { useEffect, useState, useCallback } from 'react';
import { useEditorStore } from '@/store/editor';

interface PenState {
    isDetected: boolean;
    pressure: number;
    tiltX: number;
    tiltY: number;
    pointerType: 'mouse' | 'pen' | 'touch' | null;
}

/**
 * Hook to detect pen/stylus input and auto-switch to draw mode
 */
export function usePenDetection(autoSwitchToDraw = true) {
    const { activeTool, setActiveTool } = useEditorStore();
    const [penState, setPenState] = useState<PenState>({
        isDetected: false,
        pressure: 0,
        tiltX: 0,
        tiltY: 0,
        pointerType: null,
    });
    const [showIndicator, setShowIndicator] = useState(false);

    const handlePointerDown = useCallback((e: PointerEvent) => {
        const isPen = e.pointerType === 'pen';

        setPenState({
            isDetected: isPen,
            pressure: e.pressure,
            tiltX: e.tiltX,
            tiltY: e.tiltY,
            pointerType: e.pointerType as 'mouse' | 'pen' | 'touch',
        });

        // Auto-switch to draw mode when pen is detected
        if (isPen && autoSwitchToDraw && activeTool !== 'draw') {
            setActiveTool('draw');
            setShowIndicator(true);
            // Hide indicator after 2 seconds
            setTimeout(() => setShowIndicator(false), 2000);
        }
    }, [activeTool, setActiveTool, autoSwitchToDraw]);

    const handlePointerMove = useCallback((e: PointerEvent) => {
        if (e.pointerType === 'pen') {
            setPenState(prev => ({
                ...prev,
                pressure: e.pressure,
                tiltX: e.tiltX,
                tiltY: e.tiltY,
            }));
        }
    }, []);

    useEffect(() => {
        window.addEventListener('pointerdown', handlePointerDown);
        window.addEventListener('pointermove', handlePointerMove);

        return () => {
            window.removeEventListener('pointerdown', handlePointerDown);
            window.removeEventListener('pointermove', handlePointerMove);
        };
    }, [handlePointerDown, handlePointerMove]);

    return { penState, showIndicator };
}

/**
 * Component that shows a pen detection indicator
 */
export function PenDetectionIndicator() {
    const { penState, showIndicator } = usePenDetection(true);
    const { theme } = useEditorStore();

    if (!showIndicator) return null;

    return (
        <div
            className="fixed top-20 left-1/2 -translate-x-1/2 z-50 px-4 py-2 rounded-full flex items-center gap-2 animate-in fade-in slide-in-from-top-2 duration-300"
            style={{
                backgroundColor: theme === 'dark' ? 'rgba(139, 92, 246, 0.9)' : 'rgba(124, 58, 237, 0.9)',
                boxShadow: '0 4px 20px rgba(139, 92, 246, 0.4)',
            }}
        >
            <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                    d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z" />
            </svg>
            <span className="text-white text-sm font-medium">
                Pen detected • Draw mode activated
            </span>
        </div>
    );
}
