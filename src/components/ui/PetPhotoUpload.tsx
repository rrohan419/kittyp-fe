import React, { useState, useRef } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { Badge } from '@/components/ui/badge';
import { Camera, Upload, X, Plus, Image as ImageIcon } from 'lucide-react';
import { cn } from '@/lib/utils';
import { uploadPetPhotos, fileToBase64, type UploadProgress } from '@/services/fileUploadService';
import { updatePetPhotos } from '@/services/UserService';
import { toast } from 'sonner';

interface PetPhotoUploadProps {
  currentPhotos?: string[];
  onUploadComplete: (urls: string[]) => void;
  onUploadError?: (error: string) => void;
  className?: string;
  disabled?: boolean;
  maxPhotos?: number;
  petName?: string;
  petUuid?: string;
}

export const PetPhotoUpload: React.FC<PetPhotoUploadProps> = ({
  currentPhotos = [],
  onUploadComplete,
  onUploadError,
  className,
  disabled = false,
  maxPhotos = 5,
  petName,
  petUuid
}) => {
  const [isUploading, setIsUploading] = useState(false);
  const [progress, setProgress] = useState<UploadProgress | null>(null);
  const [previewPhotos, setPreviewPhotos] = useState<string[]>([]);
  const [selectedFiles, setSelectedFiles] = useState<File[]>([]);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const allPhotos = [...currentPhotos, ...previewPhotos];
  const canAddMore = allPhotos.length < maxPhotos;

  const handleFileSelect = async (files: FileList) => {
    const fileArray = Array.from(files);
    const remainingSlots = maxPhotos - allPhotos.length;
    
    if (fileArray.length > remainingSlots) {
      toast.error(`You can only add ${remainingSlots} more photo${remainingSlots !== 1 ? 's' : ''}`);
      return;
    }

    try {
      const previews = await Promise.all(
        fileArray.map(file => fileToBase64(file))
      );
      setPreviewPhotos(prev => [...prev, ...previews]);
      setSelectedFiles(prev => [...prev, ...fileArray]);
    } catch (error) {
      console.error('Error creating previews:', error);
      toast.error('Error creating image previews');
    }
  };

  const handleFileInputChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (files) {
      await handleFileSelect(files);
    }
  };

  const handleUpload = async () => {
    if (selectedFiles.length === 0) {
      toast.error('Please select photos to upload');
      return;
    }

    setIsUploading(true);
    setProgress(null);

    try {
      // Upload the actual files to S3 and get URLs
      const urls = await uploadPetPhotos(selectedFiles, (progress) => setProgress(progress));
      const uploadedUrls = [...currentPhotos, ...urls];

      // If we have a pet UUID, save the photos to the pet profile
      if (petUuid) {
        await updatePetPhotos(petUuid, uploadedUrls);
      }

      onUploadComplete(uploadedUrls);
      setPreviewPhotos([]);
      setSelectedFiles([]);

      // Reset file input
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
      toast.success('Pet photos uploaded successfully!');
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
    setPreviewPhotos([]);
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const removePhoto = (index: number) => {
    if (index < currentPhotos.length) {
      // Remove from current photos
      const newCurrentPhotos = currentPhotos.filter((_, i) => i !== index);
      onUploadComplete(newCurrentPhotos);
    } else {
      // Remove from preview photos
      const previewIndex = index - currentPhotos.length;
      setPreviewPhotos(prev => prev.filter((_, i) => i !== previewIndex));
    }
  };

  return (
    <div className={cn('space-y-4', className)}>
      <Card>
        <CardContent className="p-6">
          {/* Header */}
          <div className="flex items-center justify-between mb-4">
            <div>
              <h3 className="font-semibold text-lg">
                {petName ? `${petName}'s Photos` : 'Pet Photos'}
              </h3>
              <p className="text-sm text-muted-foreground">
                {allPhotos.length} of {maxPhotos} photos
              </p>
            </div>
            <Badge variant="secondary">
              {allPhotos.length}/{maxPhotos}
            </Badge>
          </div>

          {/* Photo Grid */}
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4 mb-4">
            {allPhotos.map((photo, index) => (
              <div key={index} className="relative group">
                <div className="aspect-square rounded-lg overflow-hidden border-2 border-muted">
                  <img
                    src={photo}
                    alt={`Pet photo ${index + 1}`}
                    className="w-full h-full object-cover"
                  />
                </div>
                <Button
                  variant="destructive"
                  size="sm"
                  className="absolute top-1 right-1 opacity-0 group-hover:opacity-100 transition-opacity"
                  onClick={() => removePhoto(index)}
                  disabled={isUploading}
                >
                  <X className="h-3 w-3" />
                </Button>
                {index >= currentPhotos.length && (
                  <Badge className="absolute bottom-1 left-1 text-xs">
                    New
                  </Badge>
                )}
              </div>
            ))}

            {/* Add Photo Button */}
            {canAddMore && !isUploading && (
              <div className="aspect-square rounded-lg border-2 border-dashed border-muted-foreground/25 flex items-center justify-center hover:border-primary/50 transition-colors">
                <Button
                  variant="ghost"
                  onClick={() => fileInputRef.current?.click()}
                  disabled={disabled}
                  className="flex flex-col items-center space-y-2 h-full w-full"
                >
                  <Plus className="h-8 w-8 text-muted-foreground" />
                  <span className="text-sm text-muted-foreground">Add Photo</span>
                </Button>
              </div>
            )}
          </div>

          {/* Upload Progress */}
          {isUploading && progress && (
            <div className="space-y-2 mb-4">
              <div className="flex justify-between text-sm">
                <span>Uploading photos...</span>
                <span>{progress.percentage}%</span>
              </div>
              <Progress value={progress.percentage} className="h-2" />
            </div>
          )}

          {/* Action Buttons */}
          {previewPhotos.length > 0 && (
            <div className="flex space-x-2">
              <Button
                onClick={handleUpload}
                disabled={isUploading}
              >
                {isUploading ? 'Uploading...' : 'Save Photos'}
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

          {/* Hidden File Input */}
          <input
            ref={fileInputRef}
            type="file"
            multiple
            accept="image/*"
            onChange={handleFileInputChange}
            className="hidden"
            disabled={disabled || isUploading}
          />

          {/* Help Text */}
          <p className="text-xs text-muted-foreground mt-4">
            Supported formats: JPEG, PNG, WebP (Max 3MB per photo, up to {maxPhotos} photos)
          </p>
        </CardContent>
      </Card>
    </div>
  );
}; 