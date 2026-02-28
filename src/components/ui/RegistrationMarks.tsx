'use client';

interface RegistrationMarksProps {
    color?: string;
    size?: number;
    inset?: number;
}

/**
 * RegistrationMarks — Four corner L-brackets + center crosshair.
 *
 * Signals that the parent area is a framed/bounded canvas or print area.
 * All marks are purely decorative (`aria-hidden`, `pointer-events: none`).
 */
export function RegistrationMarks({
    color = 'rgba(255,255,255,0.2)',
    size = 20,
    inset = 20,
}: RegistrationMarksProps) {
    const base: React.CSSProperties = {
        position: 'absolute',
        width: size,
        height: size,
        border: `1px solid ${color}`,
        pointerEvents: 'none',
    };

    const crossLen = size * 2;
    const crossCenter = size;

    return (
        <div aria-hidden style={{ position: 'absolute', inset: 0, pointerEvents: 'none' }}>
            {/* Corners */}
            <div style={{ ...base, top: inset, left: inset, borderRight: 'none', borderBottom: 'none' }} />
            <div style={{ ...base, top: inset, right: inset, borderLeft: 'none', borderBottom: 'none' }} />
            <div style={{ ...base, bottom: inset, left: inset, borderRight: 'none', borderTop: 'none' }} />
            <div style={{ ...base, bottom: inset, right: inset, borderLeft: 'none', borderTop: 'none' }} />

            {/* Center crosshair */}
            <div
                style={{
                    position: 'absolute',
                    top: '50%',
                    left: '50%',
                    width: crossLen,
                    height: crossLen,
                    transform: 'translate(-50%, -50%)',
                    pointerEvents: 'none',
                }}
            >
                {/* Horizontal */}
                <div
                    style={{
                        position: 'absolute',
                        top: crossCenter - 1,
                        left: 0,
                        width: crossLen,
                        height: 2,
                        background: color,
                    }}
                />
                {/* Vertical */}
                <div
                    style={{
                        position: 'absolute',
                        left: crossCenter - 1,
                        top: 0,
                        width: 2,
                        height: crossLen,
                        background: color,
                    }}
                />
            </div>
        </div>
    );
}
