'use client';

import { useState } from 'react';
import type { EmbedBlock, EmbedType } from '@/types/blocks';
import { useEditorStore } from '@/store/editor';
import { detectEmbedType, getEmbedUrl, getEmbedTypeName, getEmbedTypeColor, parseEmbedInput } from '@/utils/embedUtils';

interface Props {
    block: EmbedBlock;
}

export function EmbedElement({ block }: Props) {
    const { updateBlock, theme } = useEditorStore();
    const [isEditing, setIsEditing] = useState(!block.url);
    const [inputUrl, setInputUrl] = useState(block.url || '');

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        if (inputUrl.trim()) {
            // Parse the input to extract URL from iframe code if needed
            const parsedUrl = parseEmbedInput(inputUrl.trim());
            const embedType = detectEmbedType(parsedUrl);
            updateBlock(block.id, {
                url: parsedUrl,
                embedType
            });
            setIsEditing(false);
        }
    };

    const embedUrl = block.url ? getEmbedUrl(block.url, block.embedType) : null;
    const bgColor = theme === 'dark' ? '#18181b' : '#f4f4f5';
    const borderColor = theme === 'dark' ? '#27272a' : '#e4e4e7';
    const embedType = block.embedType || 'generic';
    const typeColor = getEmbedTypeColor(embedType);

    // Supported platforms for display
    const platforms: { type: EmbedType; icon: string }[] = [
        { type: 'figma', icon: '🎨' },
        { type: 'figjam', icon: '🔮' },
        { type: 'notion', icon: '📝' },
        { type: 'miro', icon: '📋' },
        { type: 'loom', icon: '🎬' },
        { type: 'youtube', icon: '▶️' },
    ];

    return (
        <div
            className="w-full h-full relative"
            style={{ backgroundColor: bgColor }}
            onDoubleClick={() => setIsEditing(true)}
        >
            {isEditing || !embedUrl ? (
                <form onSubmit={handleSubmit} className="w-full h-full flex flex-col items-center justify-center p-6">
                    <div
                        className="w-14 h-14 mb-4 rounded-2xl flex items-center justify-center shadow-lg"
                        style={{
                            background: `linear-gradient(135deg, ${typeColor}20, ${typeColor}40)`,
                            border: `1px solid ${typeColor}40`
                        }}
                    >
                        <svg className="w-7 h-7" style={{ color: typeColor }} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
                        </svg>
                    </div>

                    <p className="text-sm mb-2" style={{ color: theme === 'dark' ? '#a1a1aa' : '#52525b' }}>
                        Paste a URL to embed
                    </p>

                    {/* Supported platforms */}
                    <div className="flex gap-2 mb-4">
                        {platforms.map(p => (
                            <span
                                key={p.type}
                                className="text-xs px-2 py-1 rounded-md"
                                style={{
                                    backgroundColor: theme === 'dark' ? '#27272a' : '#e4e4e7',
                                    color: theme === 'dark' ? '#a1a1aa' : '#71717a'
                                }}
                                title={getEmbedTypeName(p.type)}
                            >
                                {p.icon}
                            </span>
                        ))}
                    </div>

                    <input
                        type="text"
                        value={inputUrl}
                        onChange={(e) => setInputUrl(e.target.value)}
                        placeholder="Paste URL or embed code from Figma, Notion, Miro..."
                        className="w-full max-w-md px-4 py-3 rounded-xl border text-sm bg-transparent focus:outline-none focus:ring-2 focus:ring-violet-500 transition-all"
                        style={{
                            borderColor,
                            color: theme === 'dark' ? '#fff' : '#000'
                        }}
                        autoFocus
                    />

                    {/* Live detection preview */}
                    {inputUrl && (
                        <div
                            className="mt-2 text-xs flex items-center gap-1.5"
                            style={{ color: getEmbedTypeColor(detectEmbedType(inputUrl)) }}
                        >
                            <span className="w-2 h-2 rounded-full" style={{ backgroundColor: getEmbedTypeColor(detectEmbedType(inputUrl)) }} />
                            {inputUrl.includes('<iframe') ? 'Embed code: ' : 'Detected: '}
                            {getEmbedTypeName(detectEmbedType(inputUrl))}
                        </div>
                    )}

                    <div className="flex gap-2 mt-4">
                        <button
                            type="submit"
                            className="px-5 py-2 text-sm bg-violet-600 text-white rounded-lg hover:bg-violet-500 transition-colors font-medium"
                        >
                            Embed
                        </button>
                        {block.url && (
                            <button
                                type="button"
                                onClick={() => setIsEditing(false)}
                                className="px-5 py-2 text-sm rounded-lg transition-colors"
                                style={{ color: theme === 'dark' ? '#a1a1aa' : '#52525b' }}
                            >
                                Cancel
                            </button>
                        )}
                    </div>
                </form>
            ) : (
                <>
                    {/* Embed type badge */}
                    <div
                        className="absolute top-2 left-2 z-10 text-xs px-2 py-1 rounded-md font-medium flex items-center gap-1.5"
                        style={{
                            backgroundColor: `${typeColor}20`,
                            color: typeColor,
                            border: `1px solid ${typeColor}30`
                        }}
                    >
                        <span className="w-1.5 h-1.5 rounded-full" style={{ backgroundColor: typeColor }} />
                        {getEmbedTypeName(embedType)}
                    </div>

                    <iframe
                        src={embedUrl}
                        className="w-full h-full border-0 rounded-lg"
                        allowFullScreen
                        allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                    />
                </>
            )}
        </div>
    );
}
