import React, { useState, useRef, useCallback } from 'react';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { Card, CardContent } from '@/components/ui/card';
import { X, Upload, Image as ImageIcon, File, CheckCircle, AlertCircle } from 'lucide-react';
import { cn } from '@/lib/utils';
import { 
  uploadFiles, 
  validateFiles, 
  fileToBase64, 
  resizeImage,
  type FileUploadOptions,
  type UploadProgress 
} from '@/services/fileUploadService';
import { toast } from 'sonner';

interface FileUploadProps {
  onUploadComplete: (urls: string[]) => void;
  onUploadError?: (error: string) => void;
  options?: FileUploadOptions;
  className?: string;
  disabled?: boolean;
  showPreview?: boolean;
  maxFiles?: number;
  accept?: string;
  placeholder?: string;
  variant?: 'default' | 'drag-drop' | 'button';
}

interface FileWithPreview {
  file: File;
  preview?: string;
  id: string;
}

export const FileUpload: React.FC<FileUploadProps> = ({
  onUploadComplete,
  onUploadError,
  options = {},
  className,
  disabled = false,
  showPreview = true,
  maxFiles = 10,
  accept = 'image/*',
  placeholder = 'Click to upload or drag and drop files here',
  variant = 'drag-drop'
}) => {
  const [files, setFiles] = useState<FileWithPreview[]>([]);
  const [isUploading, setIsUploading] = useState(false);
  const [progress, setProgress] = useState<UploadProgress | null>(null);
  const [isDragOver, setIsDragOver] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileSelect = useCallback(async (selectedFiles: FileList | File[]) => {
    const fileArray = Array.from(selectedFiles);
    
    // Validate files
    const validation = validateFiles(fileArray, { ...options, maxFiles });
    if (!validation.isValid) {
      toast.error(validation.errors.join(', '));
      onUploadError?.(validation.errors.join(', '));
      return;
    }

    // Create file objects with previews
    const filesWithPreviews: FileWithPreview[] = await Promise.all(
      fileArray.map(async (file) => {
        let preview: string | undefined;
        if (showPreview && file.type.startsWith('image/')) {
          try {
            preview = await fileToBase64(file);
          } catch (error) {
            console.error('Error creating preview:', error);
          }
        }
        
        return {
          file,
          preview,
          id: `${file.name}-${Date.now()}-${Math.random()}`
        };
      })
    );

    setFiles(prev => [...prev, ...filesWithPreviews]);
  }, [options, maxFiles, showPreview, onUploadError]);

  const handleUpload = async () => {
    if (files.length === 0) {
      toast.error('Please select files to upload');
      return;
    }

    setIsUploading(true);
    setProgress(null);

    try {
      // Resize images if needed
      const processedFiles = await Promise.all(
        files.map(async (fileWithPreview) => {
          if (fileWithPreview.file.type.startsWith('image/')) {
            return await resizeImage(fileWithPreview.file, 800, 800, 0.8);
          }
          return fileWithPreview.file;
        })
      );

      const urls = await uploadFiles(processedFiles, {
        ...options,
        onProgress: (progress) => setProgress(progress),
      });

      onUploadComplete(urls);
      setFiles([]);
      toast.success('Files uploaded successfully!');
    } catch (error: any) {
      const errorMessage = error.message || 'Upload failed';
      toast.error(errorMessage);
      onUploadError?.(errorMessage);
    } finally {
      setIsUploading(false);
      setProgress(null);
    }
  };

  const removeFile = (id: string) => {
    setFiles(prev => prev.filter(f => f.id !== id));
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragOver(true);
  };

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragOver(false);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragOver(false);
    
    if (disabled || isUploading) return;
    
    const droppedFiles = e.dataTransfer.files;
    if (droppedFiles.length > 0) {
      handleFileSelect(droppedFiles);
    }
  };

  const handleFileInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFiles = e.target.files;
    if (selectedFiles) {
      handleFileSelect(selectedFiles);
    }
  };

  const renderDragDropArea = () => (
    <div
      className={cn(
        'border-2 border-dashed rounded-lg p-8 text-center transition-colors cursor-pointer',
        isDragOver 
          ? 'border-primary bg-primary/5' 
          : 'border-muted-foreground/25 hover:border-primary/50',
        disabled && 'opacity-50 cursor-not-allowed'
      )}
      onDragOver={handleDragOver}
      onDragLeave={handleDragLeave}
      onDrop={handleDrop}
      onClick={() => !disabled && !isUploading && fileInputRef.current?.click()}
    >
      <Upload className="mx-auto h-12 w-12 text-muted-foreground mb-4" />
      <p className="text-sm text-muted-foreground mb-2">{placeholder}</p>
      <p className="text-xs text-muted-foreground">
        Supported formats: JPEG, PNG, WebP (Max {Math.round((options.maxFileSize || 5 * 1024 * 1024) / 1024 / 1024)}MB)
      </p>
      <input
        ref={fileInputRef}
        type="file"
        multiple
        accept={accept}
        onChange={handleFileInputChange}
        className="hidden"
        disabled={disabled || isUploading}
      />
    </div>
  );

  const renderButton = () => (
    <div className="text-center">
      <Button
        onClick={() => fileInputRef.current?.click()}
        disabled={disabled || isUploading}
        className="mb-4"
      >
        <Upload className="h-4 w-4 mr-2" />
        Select Files
      </Button>
      <input
        ref={fileInputRef}
        type="file"
        multiple
        accept={accept}
        onChange={handleFileInputChange}
        className="hidden"
        disabled={disabled || isUploading}
      />
    </div>
  );

  return (
    <div className={cn('space-y-4', className)}>
      {/* Upload Area */}
      {variant === 'drag-drop' && renderDragDropArea()}
      {variant === 'button' && renderButton()}
      
      {/* File List */}
      {files.length > 0 && (
        <Card>
          <CardContent className="p-4">
            <div className="space-y-3">
              {files.map((fileWithPreview) => (
                <div
                  key={fileWithPreview.id}
                  className="flex items-center justify-between p-3 border rounded-lg"
                >
                  <div className="flex items-center space-x-3">
                    {fileWithPreview.preview ? (
                      <img
                        src={fileWithPreview.preview}
                        alt={fileWithPreview.file.name}
                        className="w-12 h-12 object-cover rounded"
                      />
                    ) : (
                      <File className="w-12 h-12 text-muted-foreground" />
                    )}
                    <div>
                      <p className="text-sm font-medium">{fileWithPreview.file.name}</p>
                      <p className="text-xs text-muted-foreground">
                        {(fileWithPreview.file.size / 1024 / 1024).toFixed(2)} MB
                      </p>
                    </div>
                  </div>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => removeFile(fileWithPreview.id)}
                    disabled={isUploading}
                  >
                    <X className="h-4 w-4" />
                  </Button>
                </div>
              ))}
            </div>
            
            {/* Upload Progress */}
            {isUploading && progress && (
              <div className="mt-4 space-y-2">
                <div className="flex justify-between text-sm">
                  <span>Uploading...</span>
                  <span>{progress.percentage}%</span>
                </div>
                <Progress value={progress.percentage} className="h-2" />
              </div>
            )}
            
            {/* Upload Button */}
            <div className="flex justify-between items-center mt-4">
              <p className="text-sm text-muted-foreground">
                {files.length} file{files.length !== 1 ? 's' : ''} selected
              </p>
              <div className="space-x-2">
                <Button
                  variant="outline"
                  onClick={() => setFiles([])}
                  disabled={isUploading}
                >
                  Clear
                </Button>
                <Button
                  onClick={handleUpload}
                  disabled={isUploading || files.length === 0}
                >
                  {isUploading ? 'Uploading...' : 'Upload Files'}
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
};

// Specialized components for different use cases
export const ProfilePictureUpload: React.FC<{
  onUploadComplete: (url: string) => void;
  onUploadError?: (error: string) => void;
  className?: string;
  disabled?: boolean;
}> = ({ onUploadComplete, onUploadError, className, disabled }) => {
  return (
    <FileUpload
      onUploadComplete={(urls) => onUploadComplete(urls[0])}
      onUploadError={onUploadError}
      options={{
        maxFileSize: 2 * 1024 * 1024, // 2MB
        allowedTypes: ['image/jpeg', 'image/png', 'image/webp'],
        maxFiles: 1
      }}
      className={className}
      disabled={disabled}
      showPreview={true}
      maxFiles={1}
      accept="image/*"
      placeholder="Click to upload profile picture"
      variant="drag-drop"
    />
  );
};

export const ProductImageUpload: React.FC<{
  onUploadComplete: (urls: string[]) => void;
  onUploadError?: (error: string) => void;
  className?: string;
  disabled?: boolean;
}> = ({ onUploadComplete, onUploadError, className, disabled }) => {
  return (
    <FileUpload
      onUploadComplete={onUploadComplete}
      onUploadError={onUploadError}
      options={{
        isAdminUpload: true,
        maxFileSize: 5 * 1024 * 1024, // 5MB
        allowedTypes: ['image/jpeg', 'image/png', 'image/webp'],
        maxFiles: 10
      }}
      className={className}
      disabled={disabled}
      showPreview={true}
      maxFiles={10}
      accept="image/*"
      placeholder="Click to upload product images"
      variant="drag-drop"
    />
  );
};

export const PetPhotoUpload: React.FC<{
  onUploadComplete: (urls: string[]) => void;
  onUploadError?: (error: string) => void;
  className?: string;
  disabled?: boolean;
}> = ({ onUploadComplete, onUploadError, className, disabled }) => {
  return (
    <FileUpload
      onUploadComplete={onUploadComplete}
      onUploadError={onUploadError}
      options={{
        maxFileSize: 3 * 1024 * 1024, // 3MB
        allowedTypes: ['image/jpeg', 'image/png', 'image/webp'],
        maxFiles: 5
      }}
      className={className}
      disabled={disabled}
      showPreview={true}
      maxFiles={5}
      accept="image/*"
      placeholder="Click to upload pet photos"
      variant="drag-drop"
    />
  );
}; 