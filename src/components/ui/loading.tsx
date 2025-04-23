import React from 'react';
import { motion } from 'framer-motion';
import { Loader2 } from 'lucide-react'; // For a spinner icon

const Loading = () => {
  return (
    <div className="fixed inset-0 bg-background flex items-center justify-center z-50">
      <motion.div
        className="flex flex-col items-center gap-4"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 0.5 }}
      >
        <Loader2 className="h-12 w-12 text-primary animate-spin" />
        <p className="text-lg text-muted-foreground">Loading...</p>
      </motion.div>
    </div>
  );
};

export default Loading;
