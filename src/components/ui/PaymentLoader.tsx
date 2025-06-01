import { Loader2, CheckCircle2 } from "lucide-react";
import { cn } from "@/lib/utils";

interface PaymentLoaderProps {
  message: string;
  subMessage?: string;
  className?: string;
}

export function PaymentLoader({ message, subMessage, className }: PaymentLoaderProps) {
  return (
    <div className={cn("flex flex-col items-center justify-center p-8 text-center", className)}>
      <div className="relative">
        {/* Outer spinning circle */}
        <div className="w-20 h-20 border-4 border-kitty-200 rounded-full animate-spin-slow" />
        {/* Inner spinning circle */}
        <div className="absolute top-0 left-0 w-20 h-20 border-4 border-t-kitty-500 rounded-full animate-spin" />
        {/* Center icon */}
        <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2">
          <Loader2 className="w-8 h-8 text-kitty-500 animate-spin" />
        </div>
      </div>
      
      <h3 className="mt-8 text-xl font-semibold text-gray-900 dark:text-gray-100">
        {message}
      </h3>
      
      {subMessage && (
        <p className="mt-4 text-sm text-gray-500 dark:text-gray-400 max-w-sm">
          {subMessage}
        </p>
      )}

      <div className="mt-8 flex flex-col items-center gap-3">
        <div className="flex items-center gap-2 text-sm text-gray-500 dark:text-gray-400">
          <CheckCircle2 className="w-4 h-4 text-green-500" />
          <span>Payment received</span>
        </div>
        <div className="flex items-center gap-2 text-sm text-gray-500 dark:text-gray-400">
          <div className="w-4 h-4 relative">
            <Loader2 className="w-4 h-4 text-kitty-500 animate-spin" />
          </div>
          <span>Processing order</span>
        </div>
      </div>
    </div>
  );
} 