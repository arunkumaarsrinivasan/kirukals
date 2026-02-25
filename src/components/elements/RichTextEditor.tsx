'use client';

import { useEffect } from 'react';
import { useEditor, EditorContent, Editor } from '@tiptap/react';
import StarterKit from '@tiptap/starter-kit';
import Placeholder from '@tiptap/extension-placeholder';
import TextAlign from '@tiptap/extension-text-align';
import Underline from '@tiptap/extension-underline';
import Link from '@tiptap/extension-link';
import type { TextBlock } from '@/types/blocks';
import { useEditorStore } from '@/store/editor';
import type { JSONContent } from '@tiptap/react';

interface Props {
    block: TextBlock;
}

// Floating toolbar for text formatting
function FloatingToolbar({ editor, theme }: { editor: Editor; theme: 'light' | 'dark' }) {
    if (!editor) return null;

    const bgColor = theme === 'dark' ? '#27272a' : '#ffffff';
    const borderColor = theme === 'dark' ? '#3f3f46' : '#e4e4e7';
    const textColor = theme === 'dark' ? '#e4e4e7' : '#18181b';

    const ToolButton = ({
        active,
        onClick,
        children,
        title
    }: {
        active?: boolean;
        onClick: () => void;
        children: React.ReactNode;
        title: string;
    }) => (
        <button
            onClick={onClick}
            className={`p-1.5 rounded transition-colors ${active
                ? 'bg-violet-600 text-white'
                : 'hover:bg-zinc-700/50'
                }`}
            style={{ color: active ? undefined : textColor }}
            title={title}
        >
            {children}
        </button>
    );

    return (
        <div
            className="flex items-center gap-0.5 p-1 rounded-lg border shadow-xl mb-2"
            style={{ backgroundColor: bgColor, borderColor }}
        >
            <ToolButton
                active={editor.isActive('bold')}
                onClick={() => editor.chain().focus().toggleBold().run()}
                title="Bold (Ctrl+B)"
            >
                <svg className="w-4 h-4" viewBox="0 0 24 24" fill="currentColor">
                    <path d="M15.6 10.79c.97-.67 1.65-1.77 1.65-2.79 0-2.26-1.75-4-4-4H7v14h7.04c2.09 0 3.71-1.7 3.71-3.79 0-1.52-.86-2.82-2.15-3.42zM10 6.5h3c.83 0 1.5.67 1.5 1.5s-.67 1.5-1.5 1.5h-3v-3zm3.5 9H10v-3h3.5c.83 0 1.5.67 1.5 1.5s-.67 1.5-1.5 1.5z" />
                </svg>
            </ToolButton>

            <ToolButton
                active={editor.isActive('italic')}
                onClick={() => editor.chain().focus().toggleItalic().run()}
                title="Italic (Ctrl+I)"
            >
                <svg className="w-4 h-4" viewBox="0 0 24 24" fill="currentColor">
                    <path d="M10 4v3h2.21l-3.42 8H6v3h8v-3h-2.21l3.42-8H18V4h-8z" />
                </svg>
            </ToolButton>

            <ToolButton
                active={editor.isActive('underline')}
                onClick={() => editor.chain().focus().toggleUnderline().run()}
                title="Underline (Ctrl+U)"
            >
                <svg className="w-4 h-4" viewBox="0 0 24 24" fill="currentColor">
                    <path d="M12 17c3.31 0 6-2.69 6-6V3h-2.5v8c0 1.93-1.57 3.5-3.5 3.5S8.5 12.93 8.5 11V3H6v8c0 3.31 2.69 6 6 6zm-7 2v2h14v-2H5z" />
                </svg>
            </ToolButton>

            <ToolButton
                active={editor.isActive('strike')}
                onClick={() => editor.chain().focus().toggleStrike().run()}
                title="Strike-through"
            >
                <svg className="w-4 h-4" viewBox="0 0 24 24" fill="currentColor">
                    <path d="M10 19h4v-3h-4v3zM5 4v3h5v3h4V7h5V4H5zM3 14h18v-2H3v2z" />
                </svg>
            </ToolButton>

            <div className="w-px h-4 mx-1" style={{ backgroundColor: borderColor }} />

            <ToolButton
                active={editor.isActive('heading', { level: 1 })}
                onClick={() => editor.chain().focus().toggleHeading({ level: 1 }).run()}
                title="Heading 1"
            >
                <span className="text-xs font-bold">H1</span>
            </ToolButton>

            <ToolButton
                active={editor.isActive('heading', { level: 2 })}
                onClick={() => editor.chain().focus().toggleHeading({ level: 2 }).run()}
                title="Heading 2"
            >
                <span className="text-xs font-bold">H2</span>
            </ToolButton>

            <ToolButton
                active={editor.isActive('heading', { level: 3 })}
                onClick={() => editor.chain().focus().toggleHeading({ level: 3 }).run()}
                title="Heading 3"
            >
                <span className="text-xs font-bold">H3</span>
            </ToolButton>

            <div className="w-px h-4 mx-1" style={{ backgroundColor: borderColor }} />

            <ToolButton
                active={editor.isActive('bulletList')}
                onClick={() => editor.chain().focus().toggleBulletList().run()}
                title="Bullet List"
            >
                <svg className="w-4 h-4" viewBox="0 0 24 24" fill="currentColor">
                    <path d="M4 10.5c-.83 0-1.5.67-1.5 1.5s.67 1.5 1.5 1.5 1.5-.67 1.5-1.5-.67-1.5-1.5-1.5zm0-6c-.83 0-1.5.67-1.5 1.5S3.17 7.5 4 7.5 5.5 6.83 5.5 6 4.83 4.5 4 4.5zm0 12c-.83 0-1.5.68-1.5 1.5s.68 1.5 1.5 1.5 1.5-.68 1.5-1.5-.67-1.5-1.5-1.5zM7 19h14v-2H7v2zm0-6h14v-2H7v2zm0-8v2h14V5H7z" />
                </svg>
            </ToolButton>

            <ToolButton
                active={editor.isActive('orderedList')}
                onClick={() => editor.chain().focus().toggleOrderedList().run()}
                title="Numbered List"
            >
                <svg className="w-4 h-4" viewBox="0 0 24 24" fill="currentColor">
                    <path d="M2 17h2v.5H3v1h1v.5H2v1h3v-4H2v1zm1-9h1V4H2v1h1v3zm-1 3h1.8L2 13.1v.9h3v-1H3.2L5 10.9V10H2v1zm5-6v2h14V5H7zm0 14h14v-2H7v2zm0-6h14v-2H7v2z" />
                </svg>
            </ToolButton>

            <ToolButton
                active={editor.isActive('codeBlock')}
                onClick={() => editor.chain().focus().toggleCodeBlock().run()}
                title="Code Block"
            >
                <svg className="w-4 h-4" viewBox="0 0 24 24" fill="currentColor">
                    <path d="M9.4 16.6L4.8 12l4.6-4.6L8 6l-6 6 6 6 1.4-1.4zm5.2 0l4.6-4.6-4.6-4.6L16 6l6 6-6 6-1.4-1.4z" />
                </svg>
            </ToolButton>
        </div>
    );
}

export function RichTextEditor({ block }: Props) {
    const { updateBlock, theme, selectedBlockId } = useEditorStore();
    const isSelected = selectedBlockId === block.id;

    // Parse initial content
    const getInitialContent = (): JSONContent | undefined => {
        if (!block.content) return undefined;
        if (typeof block.content === 'string') {
            if (!block.content.trim()) return undefined;
            // Migrate plain text to Tiptap format
            return {
                type: 'doc',
                content: [{ type: 'paragraph', content: [{ type: 'text', text: block.content }] }]
            };
        }
        return block.content as JSONContent;
    };

    const editor = useEditor({
        extensions: [
            StarterKit.configure({
                heading: { levels: [1, 2, 3] },
            }),
            Placeholder.configure({
                placeholder: "Type '/' for commands or start typing...",
            }),
            TextAlign.configure({
                types: ['heading', 'paragraph'],
            }),
            Underline,
            Link.configure({
                openOnClick: false,
            }),
        ],
        content: getInitialContent(),
        editorProps: {
            attributes: {
                class: 'prose prose-sm max-w-none focus:outline-none min-h-[100px] p-2',
            },
        },
        onUpdate: ({ editor }) => {
            const json = editor.getJSON();
            const plainText = editor.getText();
            updateBlock(block.id, {
                content: json,
                plainText
            });
        },
        // Important: disable SSR to prevent hydration issues
        immediatelyRender: false,
    });

    // Sync theme styles
    useEffect(() => {
        if (!editor) return;
        const el = editor.view.dom as HTMLElement;
        el.style.color = theme === 'dark' ? '#e4e4e7' : '#18181b';
    }, [editor, theme]);

    const bgColor = theme === 'dark' ? '#18181b' : '#ffffff';

    // Show loading state while editor initializes
    if (!editor) {
        return (
            <div
                className="w-full h-full flex items-center justify-center"
                style={{ backgroundColor: bgColor }}
            >
                <span style={{ color: theme === 'dark' ? '#52525b' : '#a1a1aa', fontSize: '0.875rem' }}>
                    Loading editor...
                </span>
            </div>
        );
    }

    return (
        <div
            className={`w-full h-full flex flex-col ${theme}`}
            style={{ backgroundColor: bgColor }}
        >
            {/* Show toolbar when selected */}
            {isSelected && (
                <FloatingToolbar editor={editor} theme={theme} />
            )}

            <EditorContent
                editor={editor}
                className="flex-1 overflow-auto"
            />
        </div>
    );
}
