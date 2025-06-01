import React from 'react';

const Loading = () => {
  return (
    <div className="flex items-center justify-center min-h-screen bg-background">
      <div className="relative">
        <div className="h-16 w-16 rounded-full border-4 border-muted animate-pulse"></div>
        <div className="absolute top-0 left-0 h-16 w-16 rounded-full border-4 border-t-primary animate-spin"></div>
      </div>
    </div>
  );
};

export default Loading;
