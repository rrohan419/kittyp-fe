import { Loader } from "@/components/ui/Loader";

interface LoadingStateProps {
  message?: string;
  fullPage?: boolean;
}

export function LoadingState({ 
  message = "Loading content...", 
  fullPage = false 
}: LoadingStateProps) {
  const containerClass = fullPage 
    ? "fixed inset-0 flex items-center justify-center bg-background/80 backdrop-blur-sm z-50" 
    : "flex flex-col items-center justify-center py-12";

  return (
    <div className={containerClass}>
      <div className="text-center">
        <Loader size="medium" />
        <h3 className="mt-4 text-lg font-medium">{message}</h3>
        <p className="mt-1 text-sm text-muted-foreground">Please wait while we load your content.</p>
      </div>
    </div>
  );
}