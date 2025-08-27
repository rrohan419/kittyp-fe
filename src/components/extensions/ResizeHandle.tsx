import React from 'react';

interface ResizeHandleProps {
  position: 'top-left' | 'top-right' | 'bottom-left' | 'bottom-right';
  onResizeStart: (e: React.MouseEvent) => void;
}

export const ResizeHandle: React.FC<ResizeHandleProps> = ({ position, onResizeStart }) => {
  const getPositionClasses = () => {
    switch (position) {
      case 'top-left':
        return 'top-0 left-0 cursor-nw-resize';
      case 'top-right':
        return 'top-0 right-0 cursor-ne-resize';
      case 'bottom-left':
        return 'bottom-0 left-0 cursor-sw-resize';
      case 'bottom-right':
        return 'bottom-0 right-0 cursor-se-resize';
      default:
        return '';
    }
  };

  return (
    <div
      className={`absolute w-3 h-3 bg-blue-500 border-2 border-white rounded-full ${getPositionClasses()}`}
      onMouseDown={onResizeStart}
      style={{ zIndex: 10 }}
    />
  );
}; 