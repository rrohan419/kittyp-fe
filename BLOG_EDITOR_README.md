# Enhanced Blog Editor

A powerful rich text editor built with TipTap that includes resizable images and advanced formatting capabilities.

## Features

### 🖼️ Resizable Images
- Click on any image to see resize handles
- Drag the corner handles to resize images
- Maintains aspect ratio while resizing
- Visual feedback with blue selection border

### 📝 Rich Text Formatting
- **6 Heading Levels** (H1-H6)
- **Text Alignment** (Left, Center, Right, Justify)
- **Text Styling** (Bold, Italic, Underline, Strikethrough, Highlight)
- **Lists** (Bullet and Numbered)
- **Code Blocks** with syntax highlighting
- **Blockquotes**
- **Links** with URL input dialog
- **Horizontal Rules**

### 🎨 Enhanced UI
- Modern, clean interface
- Dark mode support
- Responsive design
- Tooltips for all buttons
- Character and word count
- Real-time formatting indicators

## Components

### BlogEditor
The main editor component that wraps TipTap with custom extensions.

```tsx
import BlogEditor from '@/components/BlogEditor';

<BlogEditor 
  content={htmlContent} 
  onChange={(newContent) => setContent(newContent)} 
/>
```

### ResizableImage Extension
Custom TipTap extension that provides image resizing functionality.

### MenuBar
Enhanced toolbar with organized button groups and dialogs for image/link insertion.

## Usage

### Basic Usage
```tsx
import React, { useState } from 'react';
import BlogEditor from '@/components/BlogEditor';

function MyComponent() {
  const [content, setContent] = useState('<p>Start writing...</p>');

  return (
    <BlogEditor 
      content={content} 
      onChange={setContent} 
    />
  );
}
```

### Adding Images
1. Click the image button in the toolbar
2. Choose to upload a file or insert from URL
3. For URL: Enter the image URL and alt text
4. For file upload: Select an image file
5. Click on the inserted image to see resize handles
6. Drag the corner handles to resize

### Keyboard Shortcuts
- `Ctrl+B` - Bold
- `Ctrl+I` - Italic
- `Ctrl+U` - Underline
- `Ctrl+K` - Insert link
- `Ctrl+Shift+K` - Code block
- `Ctrl+Z` - Undo
- `Ctrl+Y` - Redo

## File Structure

```
src/components/
├── BlogEditor.tsx              # Main editor component
├── MenuBar.tsx                 # Enhanced toolbar
├── editor.css                  # Editor styles
└── extensions/
    ├── ResizableImage.ts       # Custom image extension
    ├── ResizableImageComponent.tsx  # Image component with resize handles
    └── ResizeHandle.tsx        # Resize handle component
```

## Dependencies

- `@tiptap/react` - Core TipTap React integration
- `@tiptap/starter-kit` - Basic TipTap extensions
- `@tiptap/extension-image` - Image extension
- `@tiptap/extension-drag-handle` - Drag and drop functionality
- `@tiptap/extension-dropcursor` - Drop cursor indicators
- `@tiptap/extension-highlight` - Text highlighting
- `@tiptap/extension-underline` - Underline formatting
- `@tiptap/extension-text-align` - Text alignment
- `@tiptap/extension-placeholder` - Placeholder text
- `@tiptap/extension-code-block-lowlight` - Code blocks with syntax highlighting
- `@tiptap/extension-character-count` - Character counting
- `@tiptap/extension-typography` - Typography features
- `@tiptap/extension-text-style` - Text styling
- `@radix-ui/react-dialog` - Dialog components

## Customization

### Styling
The editor uses Tailwind CSS classes and custom CSS in `editor.css`. You can customize:

- Colors and themes
- Typography
- Spacing and layout
- Resize handle appearance
- Selection styles

### Extensions
Add or remove TipTap extensions in the `BlogEditor.tsx` file:

```tsx
const editor = useEditor({
  extensions: [
    StarterKit,
    ResizableImage,
    // Add your custom extensions here
  ],
  // ... other options
});
```

### Toolbar
Modify the `MenuBar.tsx` component to add or remove toolbar buttons.

## Browser Support

- Chrome 88+
- Firefox 85+
- Safari 14+
- Edge 88+

## License

This component is part of the Kittyp project and follows the same license terms. 