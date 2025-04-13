import React from 'react';
import { cn } from '@/lib/utils';

interface ProseProps {
  children: React.ReactNode;
  className?: string;
}

export function Prose({ children, className }: ProseProps) {
  return (
    <div
      className={cn(
        'prose prose-slate dark:prose-invert prose-headings:font-bold prose-headings:tracking-tight',
        'prose-h1:text-4xl prose-h2:text-3xl prose-h3:text-2xl',
        'prose-p:text-muted-foreground prose-a:text-primary',
        'prose-strong:text-foreground prose-strong:font-medium',
        'prose-code:rounded prose-code:bg-muted prose-code:px-1 prose-code:py-0.5 prose-code:font-mono prose-code:text-sm',
        'prose-blockquote:border-l-primary',
        'prose-img:rounded-md',
        'prose-li:marker:text-muted-foreground',
        'max-w-none',
        className
      )}
    >
      {children}
    </div>
  );
}

export default Prose;