import { useRef, useState } from 'react';
import { Camera, Loader2, X } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { cn } from '@/lib/utils';
import { fileToBase64, uploadPetPhotos, validateFile } from '@/services/fileUploadService';
import { toast } from 'sonner';

const MAX_BYTES = 5 * 1024 * 1024;
const ALLOWED = ['image/jpeg', 'image/png', 'image/webp'];

type Props = {
  value?: string | null;
  onChange: (url: string | null) => void;
  disabled?: boolean;
  className?: string;
  label?: string;
};

/** Compact single-photo picker for clinic/doctor/owner pet forms (max 5MB). */
export function PetPhotoField({
  value,
  onChange,
  disabled = false,
  className,
  label = 'Pet photo',
}: Props) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [uploading, setUploading] = useState(false);
  const [preview, setPreview] = useState<string | null>(null);

  const shown = preview || value || null;

  const onPick = async (file: File | undefined) => {
    if (!file) return;
    const validation = validateFile(file, {
      maxFileSize: MAX_BYTES,
      allowedTypes: ALLOWED,
      maxFiles: 1,
    });
    if (!validation.isValid) {
      toast.error(validation.errors[0] || 'Photo must be JPEG, PNG, or WebP under 5MB');
      if (inputRef.current) inputRef.current.value = '';
      return;
    }
    try {
      setPreview(await fileToBase64(file));
      setUploading(true);
      const [url] = await uploadPetPhotos([file]);
      onChange(url);
      setPreview(null);
      toast.success('Pet photo added');
    } catch (err: unknown) {
      setPreview(null);
      const msg = err instanceof Error ? err.message : 'Could not upload photo';
      toast.error(msg);
    } finally {
      setUploading(false);
      if (inputRef.current) inputRef.current.value = '';
    }
  };

  return (
    <div className={cn('space-y-1.5', className)}>
      <Label>{label}</Label>
      <div className="flex items-center gap-3">
        <button
          type="button"
          disabled={disabled || uploading}
          onClick={() => inputRef.current?.click()}
          className={cn(
            'relative h-16 w-16 rounded-xl border border-dashed overflow-hidden shrink-0',
            'bg-muted/40 hover:border-primary/50 transition',
            (disabled || uploading) && 'opacity-60 pointer-events-none'
          )}
          aria-label="Add pet photo"
        >
          {shown ? (
            <img src={shown} alt="" className="h-full w-full object-cover" />
          ) : (
            <span className="absolute inset-0 flex flex-col items-center justify-center gap-0.5 text-muted-foreground">
              {uploading ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <Camera className="h-4 w-4" />
              )}
            </span>
          )}
        </button>
        <div className="min-w-0 flex-1 space-y-1">
          <div className="flex flex-wrap gap-2">
            <Button
              type="button"
              variant="outline"
              size="sm"
              disabled={disabled || uploading}
              onClick={() => inputRef.current?.click()}
            >
              {uploading ? 'Uploading…' : shown ? 'Change photo' : 'Add photo'}
            </Button>
            {shown && !uploading && (
              <Button
                type="button"
                variant="ghost"
                size="sm"
                disabled={disabled}
                onClick={() => {
                  onChange(null);
                  setPreview(null);
                }}
              >
                <X className="h-3.5 w-3.5 mr-1" />
                Remove
              </Button>
            )}
          </div>
          <p className="text-[11px] text-muted-foreground">JPEG, PNG, or WebP · max 5MB</p>
        </div>
      </div>
      <input
        ref={inputRef}
        type="file"
        accept="image/jpeg,image/png,image/webp"
        className="hidden"
        disabled={disabled || uploading}
        onChange={(e) => void onPick(e.target.files?.[0])}
      />
    </div>
  );
}
