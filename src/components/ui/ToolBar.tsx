'use client';

export interface Tool {
    id: string;
    label: string;
    /** If true, renders in red (destructive/danger action) */
    danger?: boolean;
    /** If true, the tool button is pushed to the bottom with marginTop: auto */
    bottom?: boolean;
}

interface ToolBarProps {
    tools: Tool[];
    activeTool?: string;
    onToolChange?: (toolId: string) => void;
}

/**
 * ToolBar — Vertical right-side toolbar for the RAW_INPUT layout.
 *
 * Each button renders its label with `writing-mode: vertical-rl` (rotated text).
 * The active tool shows a 4px left-edge accent stripe in `--color-accent`.
 * Danger tools (e.g., "NUKE") render their label in red.
 *
 * @example
 * <ToolBar
 *   tools={[
 *     { id: 'pen', label: 'PEN' },
 *     { id: 'marker', label: 'MARK' },
 *     { id: 'eraser', label: 'ERASE' },
 *     { id: 'clear', label: 'NUKE', danger: true, bottom: true },
 *   ]}
 *   activeTool={tool}
 *   onToolChange={setTool}
 * />
 */
export function ToolBar({ tools, activeTool, onToolChange }: ToolBarProps) {
    const base: React.CSSProperties = {
        width: '100%',
        height: '80px',
        border: 'none',
        borderBottom: '1px solid var(--color-border)',
        backgroundColor: 'transparent',
        fontFamily: 'var(--font-mono)',
        fontSize: '0.7rem',
        textTransform: 'uppercase',
        writingMode: 'vertical-rl',
        textOrientation: 'mixed',
        transition: 'background 0.1s, color 0.1s',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        position: 'relative',
        cursor: 'crosshair',
    };

    return (
        <div
            style={{
                gridColumn: 3,
                gridRow: '2 / -1',
                borderLeft: '2px solid var(--color-border-strong)',
                backgroundColor: 'var(--color-black)',
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
            }}
        >
            {tools.map((t) => {
                const isActive = t.id === activeTool;
                const isDanger = t.danger;

                const btnStyle: React.CSSProperties = {
                    ...base,
                    marginTop: t.bottom ? 'auto' : undefined,
                    borderTop: t.bottom ? '1px solid var(--color-border)' : undefined,
                    borderBottom: t.bottom ? 'none' : base.borderBottom,
                    backgroundColor: isActive ? 'var(--color-fg)' : 'transparent',
                    color: isActive
                        ? 'var(--color-bg)'
                        : isDanger
                            ? 'var(--color-accent)'
                            : 'var(--color-muted)',
                    fontWeight: isActive ? 700 : 400,
                };

                return (
                    <button
                        key={t.id}
                        className="raw-tool-btn"
                        style={btnStyle}
                        onClick={() => onToolChange?.(t.id)}
                        aria-pressed={isActive}
                        title={t.label}
                    >
                        {/* Active indicator stripe */}
                        {isActive && (
                            <span
                                aria-hidden
                                style={{
                                    position: 'absolute',
                                    left: 0,
                                    top: 0,
                                    bottom: 0,
                                    width: '4px',
                                    background: 'var(--color-accent)',
                                }}
                            />
                        )}
                        {t.label}
                    </button>
                );
            })}
        </div>
    );
}
