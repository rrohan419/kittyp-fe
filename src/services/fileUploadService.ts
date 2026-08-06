import axiosInstance from "@/config/axionInstance";
import { toast } from "sonner";

// Types for file upload
export interface FileUploadResponse {
  success: boolean;
  data: string[];
  message: string;
}

export interface UploadProgress {
  loaded: number;
  total: number;
  percentage: number;
}

export interface FileUploadOptions {
  isAdminUpload?: boolean;
  onProgress?: (progress: UploadProgress) => void;
  maxFileSize?: number; // in bytes
  allowedTypes?: string[];
  maxFiles?: number;
}

export interface FileValidationResult {
  isValid: boolean;
  errors: string[];
}

// File validation utilities
export const validateFile = (
  file: File,
  options: FileUploadOptions = {}
): FileValidationResult => {
  const errors: string[] = [];
  const {
    maxFileSize = 20 * 1024 * 1024, // 20MB default
    allowedTypes = ['image/jpeg', 'image/png', 'image/webp', 'image/gif'],
    maxFiles = 10
  } = options;

  // Check file size
  if (file.size > maxFileSize) {
    errors.push(`File size must be less than ${Math.round(maxFileSize / 1024 / 1024)}MB`);
  }

  // Check file type
  if (!allowedTypes.includes(file.type)) {
    errors.push(`File type ${file.type} is not allowed. Allowed types: ${allowedTypes.join(', ')}`);
  }

  return {
    isValid: errors.length === 0,
    errors
  };
};

export const validateFiles = (
  files: File[],
  options: FileUploadOptions = {}
): FileValidationResult => {
  const errors: string[] = [];
  const { maxFiles = 10 } = options;

  // Check number of files
  if (files.length > maxFiles) {
    errors.push(`Maximum ${maxFiles} files allowed`);
  }

  // Validate each file
  files.forEach((file, index) => {
    const validation = validateFile(file, options);
    if (!validation.isValid) {
      validation.errors.forEach(error => {
        errors.push(`File ${index + 1} (${file.name}): ${error}`);
      });
    }
  });

  return {
    isValid: errors.length === 0,
    errors
  };
};

// Main upload function
export const uploadFiles = async (
  files: File[],
  options: FileUploadOptions = {}
): Promise<string[]> => {
  try {
    // Validate files before upload
    const validation = validateFiles(files, options);
    if (!validation.isValid) {
      throw new Error(`File validation failed: ${validation.errors.join(', ')}`);
    }

    // Create FormData
    const formData = new FormData();
    files.forEach((file) => {
      formData.append('files', file);
    });

    // Add admin upload flag if specified
    if (options.isAdminUpload) {
      formData.append('isAdminUpload', 'true');
    }

    // Upload with progress tracking
    const response = await axiosInstance.post<FileUploadResponse>(
      '/upload/public-url',
      formData,
      {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
        onUploadProgress: (progressEvent) => {
          if (options.onProgress && progressEvent.total) {
            const progress: UploadProgress = {
              loaded: progressEvent.loaded,
              total: progressEvent.total,
              percentage: Math.round((progressEvent.loaded * 100) / progressEvent.total)
            };
            options.onProgress(progress);
          }
        },
      }
    );

    if (response.data.success) {
      return response.data.data;
    } else {
      throw new Error(response.data.message || 'Upload failed');
    }
  } catch (error: any) {
    console.error('File upload error:', error);
    const errorMessage = error.response?.data?.message || error.message || 'Upload failed';
    toast.error(errorMessage);
    throw new Error(errorMessage);
  }
};

/** Unauthenticated upload used during doctor signup (before account exists). */
export const uploadSignupDocuments = async (
  files: File[],
  email: string,
  _onProgress?: (progress: UploadProgress) => void
): Promise<string[]> => {
  const validation = validateFiles(files, {
    maxFileSize: 10 * 1024 * 1024,
    allowedTypes: [
      'image/jpeg',
      'image/png',
      'image/webp',
      'application/pdf',
    ],
    maxFiles: 5,
  });
  if (!validation.isValid) {
    throw new Error(validation.errors.join(', '));
  }

  const formData = new FormData();
  files.forEach((file) => formData.append('files', file));
  // Email only in the query string — also appending it to multipart makes Spring join
  // the two values with a comma, which breaks OTP verification key lookup.

  // Use fetch (not axios) so a business-error status cannot trigger the
  // global 401 → /login interceptor while the user is still signing up.
  const { API_BASE_URL } = await import('@/config/env');
  const { parseApiErrorMessage } = await import('@/utils/validation');
  const res = await fetch(
    `${API_BASE_URL}/upload/signup-documents?email=${encodeURIComponent(email)}`,
    { method: 'POST', body: formData }
  );
  const text = await res.text();
  if (!res.ok) {
    throw new Error(parseApiErrorMessage(text, 'Upload failed'));
  }
  const data = JSON.parse(text) as FileUploadResponse;
  if (!data.success) {
    throw new Error(data.message || 'Upload failed');
  }
  return data.data;
};

// Specialized upload functions for different use cases
export const uploadProfilePicture = async (
  file: File,
  onProgress?: (progress: UploadProgress) => void
): Promise<string> => {
  const urls = await uploadFiles([file], {
    onProgress,
    maxFileSize: 5 * 1024 * 1024, // 5 MB for profile pictures
    allowedTypes: ['image/jpeg', 'image/png', 'image/webp'],
    maxFiles: 1
  });
  return urls[0];
};

export const uploadProductImages = async (
  files: File[],
  onProgress?: (progress: UploadProgress) => void
): Promise<string[]> => {
  return await uploadFiles(files, {
    isAdminUpload: true,
    onProgress,
    maxFileSize: 5 * 1024 * 1024, // 5MB for product images
    allowedTypes: ['image/jpeg', 'image/png', 'image/webp'],
    maxFiles: 10
  });
};

export const uploadPetPhotos = async (
  files: File[],
  onProgress?: (progress: UploadProgress) => void
): Promise<string[]> => {
  return await uploadFiles(files, {
    onProgress,
    maxFileSize: 3 * 1024 * 1024, // 3MB for pet photos
    allowedTypes: ['image/jpeg', 'image/png', 'image/webp'],
    maxFiles: 5
  });
};

// Utility function to convert file to base64 (for preview)
export const fileToBase64 = (file: File): Promise<string> => {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.readAsDataURL(file);
    reader.onload = () => resolve(reader.result as string);
    reader.onerror = (error) => reject(error);
  });
};

// Utility function to resize image before upload (optional)
export const resizeImage = (
  file: File,
  maxWidth: number = 800,
  maxHeight: number = 800,
  quality: number = 0.8
): Promise<File> => {
  return new Promise((resolve) => {
    const canvas = document.createElement('canvas');
    const ctx = canvas.getContext('2d');
    const img = new Image();

    img.onload = () => {
      // Calculate new dimensions
      let { width, height } = img;
      if (width > height) {
        if (width > maxWidth) {
          height = (height * maxWidth) / width;
          width = maxWidth;
        }
      } else {
        if (height > maxHeight) {
          width = (width * maxHeight) / height;
          height = maxHeight;
        }
      }

      canvas.width = width;
      canvas.height = height;

      // Draw and resize
      ctx?.drawImage(img, 0, 0, width, height);

      // Convert to blob
      canvas.toBlob(
        (blob) => {
          if (blob) {
            const resizedFile = new File([blob], file.name, {
              type: file.type,
              lastModified: Date.now(),
            });
            resolve(resizedFile);
          } else {
            resolve(file);
          }
        },
        file.type,
        quality
      );
    };

    img.src = URL.createObjectURL(file);
  });
};

// Hook for file upload with progress
export const useFileUpload = () => {
  const [isUploading, setIsUploading] = useState(false);
  const [progress, setProgress] = useState<UploadProgress | null>(null);

  const upload = async (
    files: File[],
    options: Omit<FileUploadOptions, 'onProgress'> = {}
  ): Promise<string[]> => {
    setIsUploading(true);
    setProgress(null);

    try {
      const urls = await uploadFiles(files, {
        ...options,
        onProgress: (progress) => setProgress(progress),
      });
      toast.success('Files uploaded successfully!');
      return urls;
    } catch (error) {
      toast.error('Upload failed. Please try again.');
      throw error;
    } finally {
      setIsUploading(false);
      setProgress(null);
    }
  };

  return {
    upload,
    isUploading,
    progress,
  };
};

// Import useState for the hook
import { useState } from 'react'; 