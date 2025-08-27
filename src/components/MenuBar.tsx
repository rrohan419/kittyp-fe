import { Editor } from '@tiptap/react';
import { Button } from '@/components/ui/button';
import { Bold, Italic, Strikethrough, Code, Heading1, Heading2, Heading3, Heading4, Heading5, Heading6, Pilcrow, List, ListOrdered, Quote, Minus, CornerUpLeft, CornerUpRight, Image as ImageIcon, Link as LinkIcon, AlignLeft, AlignCenter, AlignRight, AlignJustify, Highlighter } from 'lucide-react';
import { useRef, useState } from 'react';
import { uploadFiles } from '@/services/fileService';
import { useToast } from '@/hooks/use-toast';
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip"
import { Underline as UnderlineIcon } from 'lucide-react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"

const MenuBar = ({ editor }: { editor: Editor | null }) => {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const { toast } = useToast();
  const [imageDialogOpen, setImageDialogOpen] = useState(false);
  const [linkDialogOpen, setLinkDialogOpen] = useState(false);
  const [imageUrl, setImageUrl] = useState('');
  const [imageAlt, setImageAlt] = useState('');
  const [linkUrl, setLinkUrl] = useState('');
  const [linkText, setLinkText] = useState('');

  if (!editor) {
    return null;
  }

  const handleFileChange = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const files = event.target.files;
    if (files && files.length > 0) {
      try {
        const response = await uploadFiles(Array.from(files));
        const imageUrl = response.data[0];
        if (imageUrl) {
          editor.chain().focus().setImage({ 
            src: imageUrl,
            alt: files[0].name,
            title: files[0].name
          }).run();
          
          // Close the dialog and clear form after successful upload
          setImageDialogOpen(false);
          setImageUrl('');
          setImageAlt('');
        }
      } catch (error) {
        toast.error("Error uploading image. Please try again.");
      }
    }
    
    // Clear the file input so the same file can be selected again
    if (event.target) {
      event.target.value = '';
    }
  };

  const addImage = () => {
    fileInputRef.current?.click();
  };

  const addImageFromUrl = () => {
    if (imageUrl.trim()) {
      editor.chain().focus().setImage({ 
        src: imageUrl,
        alt: imageAlt || 'Image',
        title: imageAlt || 'Image'
      }).run();
      setImageUrl('');
      setImageAlt('');
      setImageDialogOpen(false);
    }
  };

  const addLink = () => {
    if (linkUrl.trim()) {
      const selectedText = editor.state.doc.textBetween(
        editor.state.selection.from,
        editor.state.selection.to
      );
      
      if (selectedText) {
        editor.chain().focus().setLink({ href: linkUrl }).run();
      } else {
        editor.chain().focus().insertContent(`<a href="${linkUrl}">${linkText || linkUrl}</a>`).run();
      }
      
      setLinkUrl('');
      setLinkText('');
      setLinkDialogOpen(false);
    }
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
    <div className="flex flex-wrap items-center gap-1 p-2 border-b bg-gray-50 dark:bg-gray-800">
      <input
        type="file"
        ref={fileInputRef}
        onChange={handleFileChange}
        className="hidden"
        accept="image/*"
      />

      {/* Text Formatting */}
      <div className="flex items-center gap-1 border-r pr-2">
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
          tooltip="Underline"
          onClick={() => editor.chain().focus().toggleUnderline().run()}
          disabled={!editor.can().chain().focus().toggleUnderline().run()}
          variant={editor.isActive('underline') ? 'default' : 'outline'}
        >
          <UnderlineIcon className="w-4 h-4" />
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
          tooltip="Highlight"
          onClick={() => editor.chain().focus().toggleHighlight().run()}
          variant={editor.isActive('highlight') ? 'default' : 'outline'}
        >
          <Highlighter className="w-4 h-4" />
        </TooltipButton>
      </div>

      {/* Headings */}
      <div className="flex items-center gap-1 border-r pr-2">
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
          tooltip="Heading 4"
          onClick={() => editor.chain().focus().toggleHeading({ level: 4 }).run()}
          variant={editor.isActive('heading', { level: 4 }) ? 'default' : 'outline'}
        >
          <Heading4 className="w-4 h-4" />
        </TooltipButton>

        <TooltipButton
          tooltip="Heading 5"
          onClick={() => editor.chain().focus().toggleHeading({ level: 5 }).run()}
          variant={editor.isActive('heading', { level: 5 }) ? 'default' : 'outline'}
        >
          <Heading5 className="w-4 h-4" />
        </TooltipButton>

        <TooltipButton
          tooltip="Heading 6"
          onClick={() => editor.chain().focus().toggleHeading({ level: 6 }).run()}
          variant={editor.isActive('heading', { level: 6 }) ? 'default' : 'outline'}
        >
          <Heading6 className="w-4 h-4" />
        </TooltipButton>

        <TooltipButton
          tooltip="Paragraph"
          onClick={() => editor.chain().focus().setParagraph().run()}
          variant={editor.isActive('paragraph') ? 'default' : 'outline'}
        >
          <Pilcrow className="w-4 h-4" />
        </TooltipButton>
      </div>

      {/* Lists */}
      <div className="flex items-center gap-1 border-r pr-2">
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
      </div>

      {/* Alignment */}
      <div className="flex items-center gap-1 border-r pr-2">
        <TooltipButton
          tooltip="Align Left"
          onClick={() => editor.chain().focus().setTextAlign('left').run()}
          variant={editor.isActive({ textAlign: 'left' }) ? 'default' : 'outline'}
        >
          <AlignLeft className="w-4 h-4" />
        </TooltipButton>

        <TooltipButton
          tooltip="Align Center"
          onClick={() => editor.chain().focus().setTextAlign('center').run()}
          variant={editor.isActive({ textAlign: 'center' }) ? 'default' : 'outline'}
        >
          <AlignCenter className="w-4 h-4" />
        </TooltipButton>

        <TooltipButton
          tooltip="Align Right"
          onClick={() => editor.chain().focus().setTextAlign('right').run()}
          variant={editor.isActive({ textAlign: 'right' }) ? 'default' : 'outline'}
        >
          <AlignRight className="w-4 h-4" />
        </TooltipButton>

        <TooltipButton
          tooltip="Justify"
          onClick={() => editor.chain().focus().setTextAlign('justify').run()}
          variant={editor.isActive({ textAlign: 'justify' }) ? 'default' : 'outline'}
        >
          <AlignJustify className="w-4 h-4" />
        </TooltipButton>
      </div>

      {/* Code */}
      <div className="flex items-center gap-1 border-r pr-2">
        <TooltipButton
          tooltip="Inline Code"
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
      </div>

      {/* Other Elements */}
      <div className="flex items-center gap-1 border-r pr-2">
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
      </div>

      {/* Media */}
      <div className="flex items-center gap-1 border-r pr-2">
        <Dialog open={imageDialogOpen} onOpenChange={setImageDialogOpen}>
          <DialogTrigger asChild>
            <TooltipButton
              tooltip="Insert Image"
              onClick={() => {}}
              variant="outline"
            >
              <ImageIcon className="w-4 h-4" />
            </TooltipButton>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Insert Image</DialogTitle>
            </DialogHeader>
            <div className="space-y-4">
              <div>
                <Label htmlFor="image-url">Image URL</Label>
                <Input
                  id="image-url"
                  value={imageUrl}
                  onChange={(e) => setImageUrl(e.target.value)}
                  placeholder="https://example.com/image.jpg"
                />
              </div>
              <div>
                <Label htmlFor="image-alt">Alt Text</Label>
                <Input
                  id="image-alt"
                  value={imageAlt}
                  onChange={(e) => setImageAlt(e.target.value)}
                  placeholder="Description of the image"
                />
              </div>
              <div className="flex gap-2">
                <Button onClick={addImageFromUrl} className="flex-1">
                  Insert Image
                </Button>
                <Button onClick={addImage} variant="outline" className="flex-1">
                  Upload File
                </Button>
              </div>
            </div>
          </DialogContent>
        </Dialog>

        <Dialog open={linkDialogOpen} onOpenChange={setLinkDialogOpen}>
          <DialogTrigger asChild>
            <TooltipButton
              tooltip="Insert Link"
              onClick={() => {}}
              variant="outline"
            >
              <LinkIcon className="w-4 h-4" />
            </TooltipButton>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Insert Link</DialogTitle>
            </DialogHeader>
            <div className="space-y-4">
              <div>
                <Label htmlFor="link-url">URL</Label>
                <Input
                  id="link-url"
                  value={linkUrl}
                  onChange={(e) => setLinkUrl(e.target.value)}
                  placeholder="https://example.com"
                />
              </div>
              <div>
                <Label htmlFor="link-text">Link Text (optional)</Label>
                <Input
                  id="link-text"
                  value={linkText}
                  onChange={(e) => setLinkText(e.target.value)}
                  placeholder="Link text"
                />
              </div>
              <Button onClick={addLink} className="w-full">
                Insert Link
              </Button>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      {/* History */}
      <div className="flex items-center gap-1">
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
    </div>
  );
};

export default MenuBar; 