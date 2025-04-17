import { Skeleton } from "@/components/ui/skeleton";

interface LoaderProps {
  size?: "small" | "medium" | "large";
  className?: string;
  text?: string;
}

export function Loader({ size = "medium", className = "", text }: LoaderProps) {
  const dimensions = {
    small: "w-8 h-8",
    medium: "w-16 h-16",
    large: "w-24 h-24",
  };

  return (
    <div className="flex flex-col items-center justify-center p-4">
      <div className={`relative ${dimensions[size]} ${className}`}>
        <div className="absolute inset-0">
          <Skeleton className="w-full h-full rounded-full opacity-30" />
        </div>
        <div className="absolute inset-0 animate-spin">
          <div className="w-full h-full rounded-full border-4 border-transparent border-t-primary border-l-primary" />
        </div>
        <div className="absolute inset-0 flex items-center justify-center">
          <div className="w-1/2 h-1/2 rounded-full bg-background"></div>
        </div>
      </div>
      {text && <p className="mt-3 text-sm text-muted-foreground">{text}</p>}
    </div>
  );
}