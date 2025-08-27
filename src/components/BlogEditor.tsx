// File: src/components/BlogEditor.tsx

import React, { useEffect, useState } from 'react';
import { useEditor, EditorContent } from '@tiptap/react';
import StarterKit from '@tiptap/starter-kit';
import Link from '@tiptap/extension-link';
import Highlight from '@tiptap/extension-highlight';
import Underline from '@tiptap/extension-underline';
import TextAlign from '@tiptap/extension-text-align';
import Placeholder from '@tiptap/extension-placeholder';
import MenuBar from './MenuBar';
import './editor.css';
import { CodeBlockLowlight } from '@tiptap/extension-code-block-lowlight';
import { common, createLowlight } from 'lowlight';
import { CharacterCount } from '@tiptap/extension-character-count';
import Typography from '@tiptap/extension-typography';
import { TextStyle } from '@tiptap/extension-text-style';
import { ResizableImage } from './extensions/ResizableImage';
import { DragHandle } from '@tiptap/extension-drag-handle';
import { Dropcursor } from '@tiptap/extension-dropcursor';

const lowlight = createLowlight(common);

export default function BlogEditor({ content, onChange }: { content: string; onChange: (content: string) => void }) {
  const [selectionTick, setSelectionTick] = useState(0);

  const editor = useEditor({
    extensions: [
      StarterKit.configure({
        heading: {
          levels: [1, 2, 3, 4, 5, 6],
        },
      }),
      ResizableImage.configure({
        inline: false,
        allowBase64: true,
        HTMLAttributes: {
          class: 'resizable-image',
        },
      }),
      Link.configure({ 
        openOnClick: false, 
        autolink: true, 
        linkOnPaste: true,
        HTMLAttributes: {
          class: 'text-blue-600 underline hover:text-blue-800',
        },
      }),
      Highlight.configure({
        HTMLAttributes: {
          class: 'bg-yellow-200 dark:bg-yellow-800',
        },
      }),
      Underline,
      TextAlign.configure({ 
        types: ['heading', 'paragraph'],
        alignments: ['left', 'center', 'right', 'justify'],
      }),
      Placeholder.configure({ 
        placeholder: 'Start writing your article...',
        emptyEditorClass: 'is-editor-empty',
      }),
      CodeBlockLowlight.configure({
        lowlight,
        HTMLAttributes: {
          class: 'bg-gray-100 dark:bg-gray-800 rounded p-4 font-mono text-sm',
        },
      }),
      Typography,
      TextStyle,
      CharacterCount.configure({
        limit: 10000,
      }),
      DragHandle,
      Dropcursor.configure({
        color: '#3b82f6',
        width: 2,
      }),
    ],
    content: content,
    onUpdate: ({ editor }) => {
      onChange(editor.getHTML());
    },
    onSelectionUpdate: () => {
      setSelectionTick((v) => v + 1);
    },
    editorProps: {
      attributes: {
        class: 'prose prose-sm sm:prose lg:prose-lg xl:prose-xl dark:prose-invert max-w-none focus:outline-none',
      },
    },
  });

  // Update editor content when the content prop changes
  useEffect(() => {
    if (!editor) return;
    try {
      const incoming = content ?? '';
      const current = editor.getHTML();
      if (incoming === current) return;

      // Avoid expensive resets if the document is equivalent
      const parseTemp = document.createElement('div');
      parseTemp.innerHTML = incoming;
      const incomingText = parseTemp.textContent || '';

      const parseCurrent = document.createElement('div');
      parseCurrent.innerHTML = current;
      const currentText = parseCurrent.textContent || '';

      if (incomingText === currentText) return;

      editor.commands.setContent(incoming);
    } catch {
      editor.commands.setContent(content);
    }
  }, [content, editor]);

  const currentBlockLabel = () => {
    if (!editor) return '—';
    if (editor.isActive('heading', { level: 1 })) return 'H1';
    if (editor.isActive('heading', { level: 2 })) return 'H2';
    if (editor.isActive('heading', { level: 3 })) return 'H3';
    if (editor.isActive('heading', { level: 4 })) return 'H4';
    if (editor.isActive('heading', { level: 5 })) return 'H5';
    if (editor.isActive('heading', { level: 6 })) return 'H6';
    if (editor.isActive('blockquote')) return 'Quote';
    if (editor.isActive('codeBlock')) return 'Code Block';
    if (editor.isActive('bulletList')) return 'Bulleted List';
    if (editor.isActive('orderedList')) return 'Numbered List';
    if (editor.isActive('image')) return 'Image';
    return 'Paragraph';
  };

  const getTextAlignLabel = () => {
    if (!editor) return '';
    if (editor.isActive({ textAlign: 'left' })) return 'Left';
    if (editor.isActive({ textAlign: 'center' })) return 'Center';
    if (editor.isActive({ textAlign: 'right' })) return 'Right';
    if (editor.isActive({ textAlign: 'justify' })) return 'Justify';
    return '';
  };

  return (
    <div className="border rounded-lg shadow-sm bg-white dark:bg-gray-900">
      {/* <MenuBar editor={editor} /> */}
      <div className="sticky top-[104px] z-10 bg-white dark:bg-gray-900 border-b">
    <MenuBar editor={editor} />
  </div>

      <div className="min-h-[400px] p-4">
        <EditorContent 
          editor={editor} 
          className="tiptap focus:outline-none"
        />
      </div>
      <div className="flex justify-between items-center text-sm text-gray-500 px-4 py-2 border-t bg-gray-50 dark:bg-gray-800 dark:text-gray-400">
        <div className="flex items-center space-x-4">
          <span className="px-2 py-1 bg-gray-200 dark:bg-gray-700 rounded text-xs font-medium">
            {currentBlockLabel()}
          </span>
          {getTextAlignLabel() && (
            <span className="px-2 py-1 bg-blue-100 dark:bg-blue-900 text-blue-800 dark:text-blue-200 rounded text-xs font-medium">
              {getTextAlignLabel()}
            </span>
          )}
        </div>
        <div className="flex items-center space-x-4">
          <span className="text-xs">
            {editor?.storage.characterCount?.characters?.() ?? 0} characters
          </span>
          <span className="text-xs">
            {editor?.storage.characterCount?.words?.() ?? 0} words
          </span>
        </div>
      </div>
    </div>
  );
}
