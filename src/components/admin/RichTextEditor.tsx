import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { 
  Bold, 
  Italic, 
  List, 
  ListOrdered, 
  Heading2, 
  Heading1,
  AlignLeft,
  AlignCenter,
  AlignRight,
  Link,
  Image,
  Code
} from 'lucide-react';
import { cn } from '@/lib/utils';

interface RichTextEditorProps {
  value: string;
  onChange: (value: string) => void;
}

const RichTextEditor = ({ value, onChange }: RichTextEditorProps) => {
  const [previewMode, setPreviewMode] = useState(false);
  
  const insertTag = (tag: string, closingTag: string = tag) => {
    // Get the textarea element
    const textarea = document.querySelector('textarea.rich-editor') as HTMLTextAreaElement;
    if (!textarea) return;
    
    const start = textarea.selectionStart;
    const end = textarea.selectionEnd;
    const selectedText = value.substring(start, end);
    const newText = `<${tag}>${selectedText}</${closingTag}>`;
    
    onChange(value.substring(0, start) + newText + value.substring(end));
    
    // After updating, set the selection back
    setTimeout(() => {
      textarea.focus();
      textarea.selectionStart = start + tag.length + 2;
      textarea.selectionEnd = start + tag.length + 2 + selectedText.length;
    }, 0);
  };
  
  const insertHeading = (level: number) => {
    const tag = `h${level}`;
    
    // Get the textarea element
    const textarea = document.querySelector('textarea.rich-editor') as HTMLTextAreaElement;
    if (!textarea) return;
    
    const start = textarea.selectionStart;
    const end = textarea.selectionEnd;
    const selectedText = value.substring(start, end);
    
    // If no text is selected, insert a placeholder heading
    if (!selectedText.trim()) {
      const newText = `<${tag}>Heading ${level}</${tag}>`;
      onChange(value.substring(0, start) + newText + value.substring(end));
      
      // Set cursor position after insertion
      setTimeout(() => {
        textarea.focus();
        textarea.selectionStart = start + tag.length + 2;
        textarea.selectionEnd = start + tag.length + 2 + `Heading ${level}`.length;
      }, 0);
      return;
    }
    
    // For selected text, wrap it in heading tags
    const newText = `<${tag}>${selectedText}</${tag}>`;
    onChange(value.substring(0, start) + newText + value.substring(end));
    
    // After updating, set the selection back
    setTimeout(() => {
      textarea.focus();
      textarea.selectionStart = start + tag.length + 2;
      textarea.selectionEnd = start + tag.length + 2 + selectedText.length;
    }, 0);
  };

  const insertList = (ordered: boolean) => {
    const listTag = ordered ? 'ol' : 'ul';
  
    const textarea = document.querySelector('textarea.rich-editor') as HTMLTextAreaElement;
    if (!textarea) return;
  
    const itemText = value.substring(textarea.selectionStart, textarea.selectionEnd) || 'List item';
    const listItems = itemText
      .split('\n')
      .map(item => `  <li>${item.trim()}</li>`)
      .join('\n');
    const listContent = `<${listTag}>\n${listItems}\n</${listTag}>`;
  
    const start = textarea.selectionStart;
  
    onChange(value.substring(0, start) + listContent + value.substring(textarea.selectionEnd));
  
    // Set cursor position after insertion
    setTimeout(() => {
      textarea.focus();
      textarea.selectionStart = start + listContent.length;
      textarea.selectionEnd = start + listContent.length;
    }, 0);
  };
  
  
  const insertLink = () => {
    const url = prompt('Enter URL:', 'https://');
    if (url) {
      const textarea = document.querySelector('textarea.rich-editor') as HTMLTextAreaElement;
      const start = textarea.selectionStart;
      const end = textarea.selectionEnd;
      const selectedText = value.substring(start, end) || 'Link text';
      const linkHTML = `<a href="${url}">${selectedText}</a>`;
      
      onChange(value.substring(0, start) + linkHTML + value.substring(end));
    }
  };
  
  const insertImage = () => {
    const url = prompt('Enter image URL:', 'https://');
    const alt = prompt('Enter image alt text:', '');
    
    if (url) {
      const textarea = document.querySelector('textarea.rich-editor') as HTMLTextAreaElement;
      const start = textarea.selectionStart;
      const imageHTML = `<img src="${url}" alt="${alt || ''}" />`;
      
      onChange(value.substring(0, start) + imageHTML + value.substring(start));
    }
  };

  return (
    <div className="border rounded-md">
      <div className="flex flex-wrap gap-1 p-2 border-b bg-muted/50">
        <Button 
          type="button" 
          variant="ghost" 
          size="sm" 
          onClick={() => insertHeading(2)}
          title="Heading 2"
        >
          <Heading2 className="h-4 w-4" />
        </Button>
        
        <Button 
          type="button" 
          variant="ghost" 
          size="sm" 
          onClick={() => insertTag('p')}
          title="Paragraph"
        >
          <AlignLeft className="h-4 w-4" />
        </Button>
        
        <Button 
          type="button" 
          variant="ghost" 
          size="sm" 
          onClick={() => insertTag('strong')}
          title="Bold"
        >
          <Bold className="h-4 w-4" />
        </Button>
        
        <Button 
          type="button" 
          variant="ghost" 
          size="sm" 
          onClick={() => insertTag('em')}
          title="Italic"
        >
          <Italic className="h-4 w-4" />
        </Button>
        
        <Button 
          type="button" 
          variant="ghost" 
          size="sm" 
          onClick={() => insertList(false)}
          title="Unordered List"
        >
          <List className="h-4 w-4" />
        </Button>
        
        <Button 
          type="button" 
          variant="ghost" 
          size="sm" 
          onClick={() => insertList(true)}
          title="Ordered List"
        >
          <ListOrdered className="h-4 w-4" />
        </Button>
        
        <Button 
          type="button" 
          variant="ghost" 
          size="sm" 
          onClick={insertLink}
          title="Insert Link"
        >
          <Link className="h-4 w-4" />
        </Button>
        
        <Button 
          type="button" 
          variant="ghost" 
          size="sm" 
          onClick={insertImage}
          title="Insert Image"
        >
          <Image className="h-4 w-4" />
        </Button>
        
        <div className="grow"></div>
        
        <Button 
          type="button" 
          variant="outline" 
          size="sm" 
          onClick={() => setPreviewMode(!previewMode)}
        >
          {previewMode ? "Edit" : "Preview"}
        </Button>
      </div>
      
      {previewMode ? (
        <div 
          className="p-4 prose max-w-none min-h-[300px] bg-white dark:bg-gray-800"
          dangerouslySetInnerHTML={{ __html: value }}
        />
      ) : (
        <Textarea 
          className="rich-editor border-none min-h-[300px] rounded-t-none font-mono text-sm"
          value={value}
          onChange={(e) => onChange(e.target.value)}
          placeholder="Write your article content in HTML..."
          rows={15}
        />
      )}
    </div>
  );
};

export default RichTextEditor;
