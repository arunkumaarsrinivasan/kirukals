'use client';

import { useState, useRef } from 'react';
import type { MediaBlock } from '@/types/blocks';
import { useEditorStore } from '@/store/editor';

interface Props {
    block: MediaBlock;
}

// Maximum file size in bytes (2MB) to avoid localStorage limits
const MAX_FILE_SIZE = 2 * 1024 * 1024;

// Compress image to reduce size for storage
function compressImage(file: File, maxWidth: number = 1200): Promise<string> {
    return new Promise((resolve, reject) => {
        const canvas = document.createElement('canvas');
        const ctx = canvas.getContext('2d');
        const img = new Image();

        img.onload = () => {
            // Calculate new dimensions maintaining aspect ratio
            let width = img.width;
            let height = img.height;

            if (width > maxWidth) {
                height = (height * maxWidth) / width;
                width = maxWidth;
            }

            canvas.width = width;
            canvas.height = height;

            if (ctx) {
                ctx.drawImage(img, 0, 0, width, height);
                // Use JPEG with quality setting to reduce file size
                const dataUrl = canvas.toDataURL('image/jpeg', 0.7);
                resolve(dataUrl);
            } else {
                reject(new Error('Could not get canvas context'));
            }
        };

        img.onerror = () => reject(new Error('Failed to load image'));
        img.src = URL.createObjectURL(file);
    });
}

export function MediaElement({ block }: Props) {
    const { updateBlock, theme } = useEditorStore();
    const [isEditing, setIsEditing] = useState(!block.src);
    const [inputUrl, setInputUrl] = useState(block.src || '');
    const [dragOver, setDragOver] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [isProcessing, setIsProcessing] = useState(false);
    const fileInputRef = useRef<HTMLInputElement>(null);

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        setError(null);
        if (inputUrl.trim()) {
            // For external URLs, just use them directly
            updateBlock(block.id, { src: inputUrl.trim() });
            setIsEditing(false);
        }
    };

    const handleFileSelect = async (file: File) => {
        if (!file.type.startsWith('image/')) {
            setError('Please select an image file');
            return;
        }

        setError(null);
        setIsProcessing(true);

        try {
            if (file.size > MAX_FILE_SIZE) {
                // Compress large images
                const compressedDataUrl = await compressImage(file);
                updateBlock(block.id, { src: compressedDataUrl, alt: file.name });
            } else {
                // For small files, use regular base64
                const reader = new FileReader();
                reader.onload = (e) => {
                    const dataUrl = e.target?.result as string;
                    updateBlock(block.id, { src: dataUrl, alt: file.name });
                    setIsEditing(false);
                };
                reader.onerror = () => {
                    setError('Failed to read file');
                };
                reader.readAsDataURL(file);
            }
            setIsEditing(false);
        } catch (err) {
            setError('Failed to process image. Try a smaller file or use a URL.');
            console.error('Image processing error:', err);
        } finally {
            setIsProcessing(false);
        }
    };

    const handleDrop = (e: React.DragEvent) => {
        e.preventDefault();
        setDragOver(false);
        const file = e.dataTransfer.files[0];
        if (file) handleFileSelect(file);
    };

    const bgColor = theme === 'dark' ? '#18181b' : '#f4f4f5';
    const borderColor = theme === 'dark' ? '#27272a' : '#e4e4e7';

    return (
        <div
            className="w-full h-full"
            style={{ backgroundColor: bgColor }}
            onDoubleClick={() => setIsEditing(true)}
        >
            {isEditing || !block.src ? (
                <div
                    className={`w-full h-full flex flex-col items-center justify-center p-6 border-2 border-dashed transition-colors ${dragOver ? 'border-violet-500 bg-violet-500/10' : ''}`}
                    style={{ borderColor: dragOver ? undefined : borderColor }}
                    onDragOver={(e) => { e.preventDefault(); setDragOver(true); }}
                    onDragLeave={() => setDragOver(false)}
                    onDrop={handleDrop}
                >
                    <div className="w-12 h-12 mb-4 rounded-xl flex items-center justify-center" style={{ backgroundColor: borderColor }}>
                        <svg className="w-6 h-6 text-zinc-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                        </svg>
                    </div>

                    {isProcessing ? (
                        <p className="text-sm text-violet-400 mb-2">Processing image...</p>
                    ) : (
                        <p className="text-sm text-zinc-400 mb-2">Drop an image or paste a URL</p>
                    )}

                    {error && (
                        <p className="text-sm text-red-400 mb-2">{error}</p>
                    )}

                    <div className="flex items-center gap-3 mb-4">
                        <button
                            onClick={() => fileInputRef.current?.click()}
                            disabled={isProcessing}
                            className="px-4 py-1.5 text-sm bg-violet-600 text-white rounded-lg hover:bg-violet-500 disabled:opacity-50"
                        >
                            {isProcessing ? 'Processing...' : 'Upload'}
                        </button>
                        <span className="text-xs text-zinc-500">or</span>
                    </div>

                    <form onSubmit={handleSubmit} className="w-full max-w-sm flex gap-2">
                        <input
                            type="url"
                            value={inputUrl}
                            onChange={(e) => setInputUrl(e.target.value)}
                            placeholder="https://example.com/image.jpg"
                            className="flex-1 px-3 py-1.5 rounded-lg border text-sm bg-transparent focus:outline-none focus:ring-2 focus:ring-violet-500"
                            style={{
                                borderColor,
                                color: theme === 'dark' ? '#fff' : '#000'
                            }}
                        />
                        <button
                            type="submit"
                            className="px-3 py-1.5 text-sm text-violet-400 hover:text-violet-300"
                        >
                            Add
                        </button>
                    </form>

                    <p className="mt-3 text-[10px] text-zinc-500">
                        Large images will be compressed. For best results, use URLs.
                    </p>

                    <input
                        ref={fileInputRef}
                        type="file"
                        accept="image/*"
                        className="hidden"
                        onChange={(e) => e.target.files?.[0] && handleFileSelect(e.target.files[0])}
                    />

                    {block.src && (
                        <button
                            onClick={() => setIsEditing(false)}
                            className="mt-4 text-xs text-zinc-500 hover:text-zinc-300"
                        >
                            Cancel
                        </button>
                    )}
                </div>
            ) : (
                <img
                    src={block.src}
                    alt={block.alt || 'Image'}
                    className="w-full h-full"
                    style={{ objectFit: block.objectFit || 'cover' }}
                />
            )}
        </div>
    );
}
