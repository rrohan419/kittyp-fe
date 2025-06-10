import { toast } from "sonner";

// Re-export the toast function for backward compatibility
export const useToast = () => {
  const customToast = (message: string, options?: any) => toast(message, options);
  
  customToast.success = (message: string, options?: any) => toast.success(message, options);
  customToast.error = (message: string, options?: any) => toast.error(message, options);
  customToast.info = (message: string, options?: any) => toast.info(message, options);
  customToast.warning = (message: string, options?: any) => toast.warning(message, options);

  return { toast: customToast };
};

// Also export the raw toast function for direct use
export { toast }; 