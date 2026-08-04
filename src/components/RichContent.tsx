import React from 'react';
import { sanitizeHtml } from '@/utils/validation';

interface RichContentProps {
  html: string;
  className?: string;
}

const RichContent: React.FC<RichContentProps> = ({ html, className }) => {
  const safeHtml = sanitizeHtml(html || '');
  return (
    <div
      className={`tiptap prose prose-sm sm:prose lg:prose-lg dark:prose-invert max-w-none ${className || ''}`}
      dangerouslySetInnerHTML={{ __html: safeHtml }}
    />
  );
};

export default RichContent;
 