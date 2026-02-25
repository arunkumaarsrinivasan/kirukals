'use client';

import { useState, useEffect, useRef } from 'react';
import type { DiagramBlock, DiagramType } from '@/types/blocks';
import { useEditorStore } from '@/store/editor';

interface Props {
    block: DiagramBlock;
}

/**
 * Detect diagram type from source
 */
function detectDiagramType(source: string): DiagramType {
    if (!source) return 'auto';

    const trimmed = source.trim().toLowerCase();

    // Mermaid detection
    if (
        trimmed.startsWith('graph ') ||
        trimmed.startsWith('flowchart ') ||
        trimmed.startsWith('sequencediagram') ||
        trimmed.startsWith('classDiagram') ||
        trimmed.startsWith('stateDiagram') ||
        trimmed.startsWith('erDiagram') ||
        trimmed.startsWith('gantt') ||
        trimmed.startsWith('pie') ||
        trimmed.startsWith('journey') ||
        trimmed.startsWith('gitgraph')
    ) {
        return 'mermaid';
    }

    // Simple flowchart patterns (arrows)
    if (source.includes('-->') || source.includes('->') || source.includes('=>')) {
        return 'flowchart';
    }

    return 'auto';
}

/**
 * Simple flowchart to visual representation
 * Parses simple arrow notation: A --> B --> C
 */
function parseSimpleFlowchart(source: string): { nodes: string[]; edges: [number, number][] } {
    const nodes: string[] = [];
    const edges: [number, number][] = [];
    const nodeIndex: Record<string, number> = {};

    // Split by lines and process
    const lines = source.split('\n').filter(l => l.trim());

    for (const line of lines) {
        // Match patterns like: A --> B or A -> B
        const parts = line.split(/\s*(?:-->|->|=>)\s*/);

        for (let i = 0; i < parts.length; i++) {
            const node = parts[i].trim();
            if (!node) continue;

            if (!(node in nodeIndex)) {
                nodeIndex[node] = nodes.length;
                nodes.push(node);
            }

            if (i > 0) {
                const prevNode = parts[i - 1].trim();
                if (prevNode && nodeIndex[prevNode] !== undefined) {
                    edges.push([nodeIndex[prevNode], nodeIndex[node]]);
                }
            }
        }
    }

    return { nodes, edges };
}

export function DiagramElement({ block }: Props) {
    const { updateBlock, theme } = useEditorStore();
    const [isEditing, setIsEditing] = useState(!block.source);
    const [source, setSource] = useState(block.source || '');
    const [error, setError] = useState<string | null>(null);
    const containerRef = useRef<HTMLDivElement>(null);

    const handleSave = () => {
        const detectedType = detectDiagramType(source);
        updateBlock(block.id, { source, diagramType: detectedType });
        setIsEditing(false);
    };

    // Render mermaid diagram
    useEffect(() => {
        if (isEditing || !block.source || !containerRef.current) return;

        const renderMermaid = async () => {
            try {
                // Dynamic import of mermaid
                const mermaid = (await import('mermaid')).default;
                mermaid.initialize({
                    startOnLoad: false,
                    theme: theme === 'dark' ? 'dark' : 'default',
                    securityLevel: 'loose',
                });

                const { svg } = await mermaid.render(`mermaid-${block.id}`, block.source);
                if (containerRef.current) {
                    containerRef.current.innerHTML = svg;
                }
                setError(null);
            } catch (err) {
                console.error('Mermaid render error:', err);
                setError('Could not render diagram. Check syntax.');
            }
        };

        if (block.diagramType === 'mermaid') {
            renderMermaid();
        }
    }, [block.source, block.diagramType, block.id, isEditing, theme]);

    const bgColor = theme === 'dark' ? '#18181b' : '#ffffff';
    const textColor = theme === 'dark' ? '#e4e4e7' : '#27272a';
    const borderColor = theme === 'dark' ? '#27272a' : '#e4e4e7';

    // Simple flowchart rendering
    const renderSimpleFlowchart = () => {
        const { nodes, edges } = parseSimpleFlowchart(block.source);
        if (nodes.length === 0) return null;

        return (
            <div className="flex flex-wrap gap-4 items-center justify-center p-4">
                {nodes.map((node, i) => (
                    <div key={i} className="flex items-center gap-2">
                        <div
                            className="px-4 py-2 rounded-lg border-2 font-medium"
                            style={{
                                borderColor: '#8b5cf6',
                                backgroundColor: 'rgba(139, 92, 246, 0.1)',
                                color: textColor
                            }}
                        >
                            {node}
                        </div>
                        {i < nodes.length - 1 && edges.some(([from]) => from === i) && (
                            <svg className="w-6 h-6 text-violet-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7l5 5m0 0l-5 5m5-5H6" />
                            </svg>
                        )}
                    </div>
                ))}
            </div>
        );
    };

    return (
        <div
            className="w-full h-full overflow-auto"
            style={{ backgroundColor: bgColor, color: textColor }}
            onDoubleClick={() => setIsEditing(true)}
        >
            {isEditing ? (
                <div className="w-full h-full flex flex-col p-4">
                    <div className="flex items-center justify-between mb-2">
                        <span className="text-xs text-zinc-500">Diagram Editor</span>
                        <div className="flex gap-2">
                            <button
                                onClick={() => setIsEditing(false)}
                                className="px-3 py-1 text-xs text-zinc-400 hover:text-white transition-colors"
                            >
                                Cancel
                            </button>
                            <button
                                onClick={handleSave}
                                className="px-3 py-1 text-xs bg-violet-600 text-white rounded hover:bg-violet-500 transition-colors"
                            >
                                Render
                            </button>
                        </div>
                    </div>
                    <textarea
                        value={source}
                        onChange={(e) => setSource(e.target.value)}
                        placeholder={`Enter diagram code:\n\ngraph LR\n  A[Start] --> B[Process]\n  B --> C[End]\n\nOr simple: A --> B --> C`}
                        className="flex-1 w-full p-3 rounded-lg border bg-transparent resize-none focus:outline-none focus:ring-2 focus:ring-violet-500 font-mono text-sm"
                        style={{ borderColor, color: textColor }}
                        autoFocus
                    />
                    <div className="mt-2 text-xs text-zinc-500">
                        Supports Mermaid syntax (flowcharts, sequence diagrams, etc.) or simple arrows (A → B → C)
                    </div>
                </div>
            ) : (
                <div className="w-full h-full p-4 flex flex-col">
                    {/* Diagram badge */}
                    <div
                        className="absolute top-2 left-2 z-10 text-xs px-2 py-1 rounded-md font-medium flex items-center gap-1.5"
                        style={{
                            backgroundColor: 'rgba(34, 197, 94, 0.2)',
                            color: '#22c55e',
                            border: '1px solid rgba(34, 197, 94, 0.3)'
                        }}
                    >
                        <span className="w-1.5 h-1.5 rounded-full bg-green-500" />
                        {block.diagramType === 'mermaid' ? 'Mermaid' : 'Diagram'}
                    </div>

                    {block.source ? (
                        <div className="flex-1 flex items-center justify-center pt-6">
                            {error ? (
                                <div className="text-center text-red-400">
                                    <p className="mb-2">{error}</p>
                                    <pre className="text-xs text-zinc-500 max-w-md overflow-auto p-2 rounded bg-zinc-900">
                                        {block.source}
                                    </pre>
                                </div>
                            ) : block.diagramType === 'mermaid' ? (
                                <div ref={containerRef} className="w-full h-full flex items-center justify-center" />
                            ) : (
                                renderSimpleFlowchart()
                            )}
                        </div>
                    ) : (
                        <div className="h-full flex flex-col items-center justify-center text-zinc-500">
                            <div className="w-12 h-12 mb-4 rounded-xl bg-green-500/20 flex items-center justify-center">
                                <svg className="w-6 h-6 text-green-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 17V7m0 10a2 2 0 01-2 2H5a2 2 0 01-2-2V7a2 2 0 012-2h2a2 2 0 012 2m0 10a2 2 0 002 2h2a2 2 0 002-2M9 7a2 2 0 012-2h2a2 2 0 012 2m0 10V7m0 10a2 2 0 002 2h2a2 2 0 002-2V7a2 2 0 00-2-2h-2a2 2 0 00-2 2" />
                                </svg>
                            </div>
                            <p className="text-sm">Double-click to add diagram code</p>
                        </div>
                    )}
                </div>
            )}
        </div>
    );
}
