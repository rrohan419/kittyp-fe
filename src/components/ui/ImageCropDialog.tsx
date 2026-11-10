import { useCallback, useEffect, useState } from 'react';
import Cropper, { type Area, type Point } from 'react-easy-crop';
import { RotateCcw, RotateCw } from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
import { Slider } from '@/components/ui/slider';
import { getCroppedImageFile } from '@/utils/cropImage';
import { toast } from 'sonner';

type ImageCropDialogProps = {
  open: boolean;
  imageSrc: string | null;
  fileName?: string;
  circular?: boolean;
  onCancel: () => void;
  onComplete: (file: File) => void | Promise<void>;
};

export function ImageCropDialog({
  open,
  imageSrc,
  fileName = 'photo.jpg',
  circular = false,
  onCancel,
  onComplete,
}: ImageCropDialogProps) {
  const [crop, setCrop] = useState<Point>({ x: 0, y: 0 });
  const [zoom, setZoom] = useState(1);
  const [rotation, setRotation] = useState(0);
  const [croppedAreaPixels, setCroppedAreaPixels] = useState<Area | null>(null);
  const [applying, setApplying] = useState(false);

  useEffect(() => {
    if (!open) return;
    setCrop({ x: 0, y: 0 });
    setZoom(1);
    setRotation(0);
    setCroppedAreaPixels(null);
    setApplying(false);
  }, [open, imageSrc]);

  const onCropComplete = useCallback((_croppedArea: Area, pixels: Area) => {
    setCroppedAreaPixels(pixels);
  }, []);

  const handleApply = async () => {
    if (!imageSrc || !croppedAreaPixels) return;
    setApplying(true);
    try {
      const file = await getCroppedImageFile(imageSrc, croppedAreaPixels, rotation, fileName);
      await onComplete(file);
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : 'Could not crop photo';
      toast.error(message);
    } finally {
      setApplying(false);
    }
  };

  return (
    <Dialog
      open={open && Boolean(imageSrc)}
      onOpenChange={(next) => {
        if (!next && !applying) onCancel();
      }}
    >
      <DialogContent
        overlayClassName="z-[80]"
        className="z-[81] max-w-md p-4 sm:p-5"
        onPointerDownOutside={(e) => {
          if (applying) e.preventDefault();
        }}
        onInteractOutside={(e) => {
          if (applying) e.preventDefault();
        }}
      >
        <DialogHeader>
          <DialogTitle>Adjust photo</DialogTitle>
          <DialogDescription>Drag to reposition. Zoom and rotate before saving.</DialogDescription>
        </DialogHeader>

        <div className={`relative h-[min(360px,50dvh)] w-full overflow-hidden rounded-lg bg-muted ${applying ? 'pointer-events-none' : ''}`}>
          {imageSrc ? (
            <Cropper
              key={imageSrc}
              image={imageSrc}
              crop={crop}
              zoom={zoom}
              rotation={rotation}
              aspect={1}
              cropShape={circular ? 'round' : 'rect'}
              showGrid={!circular}
              onCropChange={setCrop}
              onZoomChange={setZoom}
              onRotationChange={setRotation}
              onCropAreaChange={onCropComplete}
              mediaProps={{ onError: () => toast.error('Could not load photo') }}
            />
          ) : null}
        </div>

        <div className="space-y-3">
          <div className="space-y-1.5">
            <Label id="photo-zoom-label">Zoom</Label>
            <Slider
              min={1}
              max={3}
              step={0.05}
              value={[zoom]}
              disabled={applying}
              onValueChange={(values) => {
                const value = values[0];
                if (value !== undefined) setZoom(value);
              }}
              thumbProps={{ 'aria-labelledby': 'photo-zoom-label' }}
            />
          </div>
          <div className="space-y-1.5">
            <div className="flex items-center justify-between gap-2">
              <Label id="photo-rotate-label">Rotate</Label>
              <div className="flex gap-1">
                <Button
                  type="button"
                  variant="outline"
                  size="icon"
                  className="h-8 w-8"
                  disabled={applying}
                  onClick={() => setRotation((r) => ((r - 90 + 540) % 360) - 180)}
                  aria-label="Rotate left"
                >
                  <RotateCcw className="h-4 w-4" />
                </Button>
                <Button
                  type="button"
                  variant="outline"
                  size="icon"
                  className="h-8 w-8"
                  disabled={applying}
                  onClick={() => setRotation((r) => ((r + 90 + 540) % 360) - 180)}
                  aria-label="Rotate right"
                >
                  <RotateCw className="h-4 w-4" />
                </Button>
              </div>
            </div>
            <Slider
              min={-180}
              max={180}
              step={1}
              value={[rotation]}
              disabled={applying}
              onValueChange={(values) => {
                const value = values[0];
                if (value !== undefined) setRotation(value);
              }}
              thumbProps={{ 'aria-labelledby': 'photo-rotate-label' }}
            />
          </div>
        </div>

        <DialogFooter>
          <Button type="button" variant="outline" onClick={onCancel} disabled={applying}>
            Cancel
          </Button>
          <Button
            type="button"
            onClick={() => void handleApply()}
            disabled={applying || !croppedAreaPixels}
          >
            {applying ? 'Applying…' : 'Apply'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
