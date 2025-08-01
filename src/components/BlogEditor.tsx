// File: src/components/BlogEditor.tsx

import React, { useEffect } from 'react';
import { useEditor, EditorContent } from '@tiptap/react';
import StarterKit from '@tiptap/starter-kit';
import Image from '@tiptap/extension-image';
import Link from '@tiptap/extension-link';
import Highlight from '@tiptap/extension-highlight';
import Underline from '@tiptap/extension-underline';
import TextAlign from '@tiptap/extension-text-align';
import Placeholder from '@tiptap/extension-placeholder';
import MenuBar from './MenuBar'; // Import the MenuBar component
import './editor.css';
import { CodeBlockLowlight } from '@tiptap/extension-code-block-lowlight';
import { common, createLowlight } from 'lowlight';
import { CharacterCount } from '@tiptap/extension-character-count';

const lowlight = createLowlight(common);

export default function BlogEditor({ content, onChange }: { content: string; onChange: (content: string) => void }) {
  const editor = useEditor({
    extensions: [
      StarterKit,
      Image,
      Link.configure({ openOnClick: false }),
      Highlight,
      Underline,
      TextAlign.configure({ types: ['heading', 'paragraph'] }),
      Placeholder.configure({ placeholder: 'Write your blog content here...' }),
      CodeBlockLowlight.configure({
        lowlight,
      }),
      CharacterCount,
    ],
    content: content,
    onUpdate: ({ editor }) => {
      onChange(editor.getHTML());
    },
  });

  // Update editor content when the content prop changes
  useEffect(() => {
    if (editor && content !== editor.getHTML()) {
      editor.commands.setContent(content);
    }
  }, [content, editor]);

  return (
    <div className="border rounded">
        <MenuBar editor={editor} />
        <div className="min-h-[200px] p-2">
        <EditorContent editor={editor} />
        </div>
        <div className="flex justify-end text-sm text-gray-500 pr-2 pb-1">
        {editor?.storage.characterCount.words()} words
        </div>
    </div>
  );
}
