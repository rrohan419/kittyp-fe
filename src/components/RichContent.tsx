import React from 'react';

interface RichContentProps {
  html: string;
  className?: string;
}

const RichContent: React.FC<RichContentProps> = ({ html, className }) => {
  return (
    <div
      className={`tiptap prose prose-sm sm:prose lg:prose-lg dark:prose-invert max-w-none ${className || ''}`}
      dangerouslySetInnerHTML={{ __html: html || '' }}
    />
  );
};

export default RichContent; 