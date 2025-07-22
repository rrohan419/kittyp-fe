import React, { useState, useRef } from 'react';
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Camera, Upload, X, User } from 'lucide-react';
import { Progress } from '@/components/ui/progress';
import { cn } from '@/lib/utils';
import { uploadProfilePicture, fileToBase64, type UploadProgress } from '@/services/fileUploadService';
import { toast } from 'sonner';

interface ProfilePictureUploadProps {
  currentImageUrl?: string;
  onUploadComplete: (url: string) => void;
  onUploadError?: (error: string) => void;
  className?: string;
  disabled?: boolean;
  size?: 'sm' | 'md' | 'lg';
  showName?: boolean;
  userName?: string;
}

export const ProfilePictureUpload: React.FC<ProfilePictureUploadProps> = ({
  currentImageUrl,
  onUploadComplete,
  onUploadError,
  className,
  disabled = false,
  size = 'md',
  showName = false,
  userName
}) => {
  const [isUploading, setIsUploading] = useState(false);
  const [progress, setProgress] = useState<UploadProgress | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const sizeClasses = {
    sm: 'h-20 w-20',
    md: 'h-32 w-32',
    lg: 'h-40 w-40'
  };

  const getInitials = (name?: string) => {
    if (!name) return 'U';
    return name
      .split(' ')
      .map(n => n[0])
      .join('')
      .toUpperCase()
      .slice(0, 2);
  };

  const handleFileSelect = async (file: File) => {
    try {
      const preview = await fileToBase64(file);
      setPreviewUrl(preview);
    } catch (error) {
      console.error('Error creating preview:', error);
      toast.error('Error creating image preview');
    }
  };

  const handleFileInputChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      await handleFileSelect(file);
    }
  };

  const handleAvatarClick = () => {
    if (!isUploading && !disabled) fileInputRef.current?.click();
  };

  const handleUpload = async () => {
    if (!fileInputRef.current?.files?.[0]) {
      toast.error('Please select an image first');
      return;
    }
    const file = fileInputRef.current.files[0];
    setIsUploading(true);
    setProgress(null);
    try {
      const url = await uploadProfilePicture(file, (progress) => setProgress(progress));
      onUploadComplete(url);
      setPreviewUrl(null);
      if (fileInputRef.current) fileInputRef.current.value = '';
      toast.success('Profile picture updated successfully!');
    } catch (error: any) {
      const errorMessage = error.message || 'Upload failed';
      toast.error(errorMessage);
      onUploadError?.(errorMessage);
    } finally {
      setIsUploading(false);
      setProgress(null);
    }
  };

  const handleCancel = () => {
    setPreviewUrl(null);
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  const displayImage = previewUrl || currentImageUrl;

  return (
    <div className={cn('flex flex-col items-center space-y-4', className)}>
      <div className="relative group">
        <Avatar className={cn('ring-2 ring-primary/20 shadow-md cursor-pointer overflow-hidden', sizeClasses[size])} onClick={handleAvatarClick}>
          {displayImage ? (
            <AvatarImage src={displayImage} alt={userName || 'Profile'} className="object-cover" />
          ) : (
            <AvatarFallback className="bg-accent text-3xl font-semibold">
              {getInitials(userName)}
            </AvatarFallback>
          )}
        </Avatar>
        {/* Overlay Camera Icon */}
        {!isUploading && !disabled && (
          <div
            className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity rounded-full flex items-center justify-center cursor-pointer"
            onClick={handleAvatarClick}
          >
            <Camera className="h-8 w-8 text-white" />
          </div>
        )}
        <input
          type="file"
          ref={fileInputRef}
          onChange={handleFileInputChange}
          accept="image/*"
          className="hidden"
          disabled={disabled || isUploading}
        />
        {/* Upload Progress Bar */}
        {isUploading && progress && (
          <div className="absolute left-0 right-0 bottom-0">
            <Progress value={progress.percentage} className="h-2 rounded-b-full" />
          </div>
        )}
      </div>
      {/* Name Display */}
      {/* {showName && userName && (
        <div className="text-center">
          <h3 className="font-semibold text-lg">{userName}</h3>
        </div>
      )} */}
      {/* Action Buttons */}
      {previewUrl && (
        <div className="flex space-x-2">
          <Button
            onClick={handleUpload}
            disabled={isUploading}
          >
            {isUploading ? 'Uploading...' : 'Save Photo'}
          </Button>
          <Button
            onClick={handleCancel}
            variant="outline"
            disabled={isUploading}
          >
            <X className="h-4 w-4 mr-2" />
            Cancel
          </Button>
        </div>
      )}
      {/* Help Text */}
      <p className="text-xs text-muted-foreground text-center max-w-xs">
        Supported formats: JPEG, PNG, WebP (Max 5MB)
      </p>
    </div>
  );
}; 