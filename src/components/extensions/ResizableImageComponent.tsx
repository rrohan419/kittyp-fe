import React, { useState, useRef, useEffect } from 'react';
import { NodeViewWrapper, NodeViewProps } from '@tiptap/react';
import { ResizeHandle } from './ResizeHandle';

export const ResizableImageComponent: React.FC<NodeViewProps> = ({ 
  node, 
  updateAttributes, 
  selected,
  editor 
}) => {
  const [isResizing, setIsResizing] = useState(false);
  const [resizeStartSize, setResizeStartSize] = useState({ width: 0, height: 0 });
  const [resizeStartPos, setResizeStartPos] = useState({ x: 0, y: 0 });
  const imageRef = useRef<HTMLImageElement>(null);

  const { src, alt, title, width, height } = node.attrs;

  const handleResizeStart = (e: React.MouseEvent, direction: string) => {
    e.preventDefault();
    e.stopPropagation();
    
    setIsResizing(true);
    setResizeStartSize({ width: width || 300, height: height || 200 });
    setResizeStartPos({ x: e.clientX, y: e.clientY });
  };

  const handleResize = (e: MouseEvent) => {
    if (!isResizing) return;

    const deltaX = e.clientX - resizeStartPos.x;
    const deltaY = e.clientY - resizeStartPos.y;

    const newWidth = Math.max(100, resizeStartSize.width + deltaX);
    const newHeight = Math.max(100, resizeStartSize.height + deltaY);

    updateAttributes({ width: newWidth, height: newHeight });
  };

  const handleResizeEnd = () => {
    setIsResizing(false);
  };

  useEffect(() => {
    if (isResizing) {
      document.addEventListener('mousemove', handleResize);
      document.addEventListener('mouseup', handleResizeEnd);
      
      return () => {
        document.removeEventListener('mousemove', handleResize);
        document.removeEventListener('mouseup', handleResizeEnd);
      };
    }
  }, [isResizing, resizeStartPos, resizeStartSize]);

  const handleImageLoad = () => {
    if (imageRef.current && !width && !height) {
      updateAttributes({
        width: imageRef.current.naturalWidth,
        height: imageRef.current.naturalHeight,
      });
    }
  };

  const handleImageClick = (e: React.MouseEvent) => {
    e.preventDefault();
    editor.commands.setNodeSelection(editor.state.selection.from);
  };

  return (
    <NodeViewWrapper className="image-node-view">
      <div 
        className={`relative inline-block ${selected ? 'ring-2 ring-blue-500' : ''}`}
        style={{ 
          width: width ? `${width}px` : 'auto',
          height: height ? `${height}px` : 'auto'
        }}
      >
        <img
          ref={imageRef}
          src={src}
          alt={alt || ''}
          title={title || ''}
          className="max-w-full h-auto cursor-pointer"
          style={{
            width: width ? `${width}px` : 'auto',
            height: height ? `${height}px` : 'auto',
            objectFit: 'contain'
          }}
          onLoad={handleImageLoad}
          onClick={handleImageClick}
          draggable={false}
        />
        
        {selected && (
          <>
            <ResizeHandle 
              position="top-left" 
              onResizeStart={(e) => handleResizeStart(e, 'top-left')} 
            />
            <ResizeHandle 
              position="top-right" 
              onResizeStart={(e) => handleResizeStart(e, 'top-right')} 
            />
            <ResizeHandle 
              position="bottom-left" 
              onResizeStart={(e) => handleResizeStart(e, 'bottom-left')} 
            />
            <ResizeHandle 
              position="bottom-right" 
              onResizeStart={(e) => handleResizeStart(e, 'bottom-right')} 
            />
          </>
        )}
      </div>
    </NodeViewWrapper>
  );
}; 