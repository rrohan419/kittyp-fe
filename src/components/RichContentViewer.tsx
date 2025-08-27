import React, { useEffect } from 'react';
import { useEditor, EditorContent } from '@tiptap/react';
import StarterKit from '@tiptap/starter-kit';
import Image from '@tiptap/extension-image';
import Link from '@tiptap/extension-link';
import Highlight from '@tiptap/extension-highlight';
import Underline from '@tiptap/extension-underline';
import TextAlign from '@tiptap/extension-text-align';
import Typography from '@tiptap/extension-typography';
import { TextStyle } from '@tiptap/extension-text-style';
import { CodeBlockLowlight } from '@tiptap/extension-code-block-lowlight';
import { common, createLowlight } from 'lowlight';

const lowlight = createLowlight(common);

interface RichContentViewerProps {
  html: string;
  className?: string;
}

const RichContentViewer: React.FC<RichContentViewerProps> = ({ html, className }) => {
  const editor = useEditor({
    editable: false,
    extensions: [
      StarterKit,
      Image,
      Link.configure({ openOnClick: true, autolink: true, linkOnPaste: true }),
      Highlight,
      Underline,
      TextAlign.configure({ types: ['heading', 'paragraph'] }),
      CodeBlockLowlight.configure({ lowlight }),
      Typography,
      TextStyle,
    ],
    content: html,
  });

  useEffect(() => {
    if (!editor) return;
    if (html !== editor.getHTML()) {
      editor.commands.setContent(html || '');
    }
  }, [html, editor]);

  return (
    <EditorContent
      editor={editor}
      className={`tiptap prose prose-sm sm:prose lg:prose-lg dark:prose-invert max-w-none ${className || ''}`}
    />
  );
};

export default RichContentViewer; 