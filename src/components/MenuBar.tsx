import { Editor } from '@tiptap/react';
import { Button } from '@/components/ui/button';
import { Bold, Italic, Strikethrough, Code, Heading1, Heading2, Heading3, Pilcrow, List, ListOrdered, Quote, Minus, CornerUpLeft, CornerUpRight, Image as ImageIcon } from 'lucide-react';
import { useRef } from 'react';
import { uploadFiles } from '@/services/fileService';
import { useToast } from '@/hooks/use-toast';
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip"


const MenuBar = ({ editor }: { editor: Editor | null }) => {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const { toast } = useToast();

  if (!editor) {
    return null;
  }

  const handleFileChange = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const files = event.target.files;
    if (files && files.length > 0) {
      try {
        const response = await uploadFiles(Array.from(files));
        const imageUrl = response.data[0]; // Assuming the first URL is the one to use
        if (imageUrl) {
          editor.chain().focus().setImage({ src: imageUrl }).run();
        }
      } catch (error) {
        toast.error("Error uploading image. Please try again.");
        console.error('Error uploading file:', error);
      }
    }
  };

  const addImage = () => {
    fileInputRef.current?.click();
  };

  const TooltipButton = ({ tooltip, onClick, children, disabled, variant }: any) => (
    <TooltipProvider>
      <Tooltip>
        <TooltipTrigger asChild>
          <Button
            type="button"
            onClick={onClick}
            disabled={disabled}
            variant={variant}
            size="sm"
          >
            {children}
          </Button>
        </TooltipTrigger>
        <TooltipContent>
          <p>{tooltip}</p>
        </TooltipContent>
      </Tooltip>
    </TooltipProvider>
  );

  return (
    <div className="flex flex-wrap items-center gap-2 p-2 border-b">
      <input
        type="file"
        ref={fileInputRef}
        onChange={handleFileChange}
        className="hidden"
        accept="image/*"
      />
        <TooltipButton
            tooltip="Bold"
            onClick={() => editor.chain().focus().toggleBold().run()}
            disabled={!editor.can().chain().focus().toggleBold().run()}
            variant={editor.isActive('bold') ? 'default' : 'outline'}
        >
            <Bold className="w-4 h-4" />
        </TooltipButton>

        <TooltipButton
            tooltip="Italic"
            onClick={() => editor.chain().focus().toggleItalic().run()}
            disabled={!editor.can().chain().focus().toggleItalic().run()}
            variant={editor.isActive('italic') ? 'default' : 'outline'}
        >
            <Italic className="w-4 h-4" />
        </TooltipButton>

        <TooltipButton
            tooltip="Strikethrough"
            onClick={() => editor.chain().focus().toggleStrike().run()}
            disabled={!editor.can().chain().focus().toggleStrike().run()}
            variant={editor.isActive('strike') ? 'default' : 'outline'}
        >
            <Strikethrough className="w-4 h-4" />
        </TooltipButton>

        <TooltipButton
            tooltip="Code"
            onClick={() => editor.chain().focus().toggleCode().run()}
            disabled={!editor.can().chain().focus().toggleCode().run()}
            variant={editor.isActive('code') ? 'default' : 'outline'}
        >
            <Code className="w-4 h-4" />
        </TooltipButton>

        <TooltipButton
            tooltip="Code Block"
            onClick={() => editor.chain().focus().toggleCodeBlock().run()}
            variant={editor.isActive('codeBlock') ? 'default' : 'outline'}
        >
            <Code className="w-4 h-4" />
        </TooltipButton>

        <TooltipButton
            tooltip="Heading 1"
            onClick={() => editor.chain().focus().toggleHeading({ level: 1 }).run()}
            variant={editor.isActive('heading', { level: 1 }) ? 'default' : 'outline'}
        >
            <Heading1 className="w-4 h-4" />
        </TooltipButton>
        
        <TooltipButton
            tooltip="Heading 2"
            onClick={() => editor.chain().focus().toggleHeading({ level: 2 }).run()}
            variant={editor.isActive('heading', { level: 2 }) ? 'default' : 'outline'}
        >
            <Heading2 className="w-4 h-4" />
        </TooltipButton>

        <TooltipButton
            tooltip="Heading 3"
            onClick={() => editor.chain().focus().toggleHeading({ level: 3 }).run()}
            variant={editor.isActive('heading', { level: 3 }) ? 'default' : 'outline'}
        >
            <Heading3 className="w-4 h-4" />
        </TooltipButton>

        <TooltipButton
            tooltip="Paragraph"
            onClick={() => editor.chain().focus().setParagraph().run()}
            variant={editor.isActive('paragraph') ? 'default' : 'outline'}
        >
            <Pilcrow className="w-4 h-4" />
        </TooltipButton>

        <TooltipButton
            tooltip="Bullet List"
            onClick={() => editor.chain().focus().toggleBulletList().run()}
            variant={editor.isActive('bulletList') ? 'default' : 'outline'}
        >
            <List className="w-4 h-4" />
        </TooltipButton>

        <TooltipButton
            tooltip="Ordered List"
            onClick={() => editor.chain().focus().toggleOrderedList().run()}
            variant={editor.isActive('orderedList') ? 'default' : 'outline'}
        >
            <ListOrdered className="w-4 h-4" />
        </TooltipButton>

        <TooltipButton
            tooltip="Blockquote"
            onClick={() => editor.chain().focus().toggleBlockquote().run()}
            variant={editor.isActive('blockquote') ? 'default' : 'outline'}
        >
            <Quote className="w-4 h-4" />
        </TooltipButton>

        <TooltipButton
            tooltip="Horizontal Rule"
            onClick={() => editor.chain().focus().setHorizontalRule().run()}
            variant="outline"
        >
            <Minus className="w-4 h-4" />
        </TooltipButton>

        <TooltipButton
            tooltip="Image"
            onClick={addImage}
            variant="outline"
        >
            <ImageIcon className="w-4 h-4" />
        </TooltipButton>

        <TooltipButton
            tooltip="Undo"
            onClick={() => editor.chain().focus().undo().run()}
            disabled={!editor.can().chain().focus().undo().run()}
            variant="outline"
        >
            <CornerUpLeft className="w-4 h-4" />
        </TooltipButton>

        <TooltipButton
            tooltip="Redo"
            onClick={() => editor.chain().focus().redo().run()}
            disabled={!editor.can().chain().focus().redo().run()}
            variant="outline"
        >
            <CornerUpRight className="w-4 h-4" />
        </TooltipButton>
    </div>
  );
};

export default MenuBar; 