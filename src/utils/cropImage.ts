import type { Area } from 'react-easy-crop';

const MAX_BYTES = 5 * 1024 * 1024;
const MAX_DIMENSION = 4096;
const OUTPUT_TYPE = 'image/jpeg';

function createImage(url: string): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const image = new Image();
    image.addEventListener('load', () => resolve(image));
    image.addEventListener('error', () => reject(new Error('Could not load photo')));
    image.crossOrigin = 'anonymous';
    image.src = url;
  });
}

function getRadianAngle(degreeValue: number): number {
  return (degreeValue * Math.PI) / 180;
}

function rotateSize(width: number, height: number, rotation: number) {
  const rotRad = getRadianAngle(rotation);
  return {
    width: Math.abs(Math.cos(rotRad) * width) + Math.abs(Math.sin(rotRad) * height),
    height: Math.abs(Math.sin(rotRad) * width) + Math.abs(Math.cos(rotRad) * height),
  };
}

async function canvasToBlob(canvas: HTMLCanvasElement, quality: number): Promise<Blob> {
  const blob = await new Promise<Blob | null>((resolve) => {
    canvas.toBlob((result) => resolve(result), OUTPUT_TYPE, quality);
  });
  if (!blob) {
    throw new Error('Could not create cropped image');
  }
  return blob;
}

export async function getCroppedImageFile(
  imageSrc: string,
  pixelCrop: Area,
  rotation = 0,
  fileName = 'photo.jpg'
): Promise<File> {
  if (!Number.isFinite(pixelCrop.x) || !Number.isFinite(pixelCrop.y) ||
      !Number.isFinite(pixelCrop.width) || !Number.isFinite(pixelCrop.height) ||
      pixelCrop.width <= 0 || pixelCrop.height <= 0 || !Number.isFinite(rotation)) {
    throw new Error('Invalid crop area');
  }

  const image = await createImage(imageSrc);
  const rotRad = getRadianAngle(rotation);
  const { width: bBoxWidth, height: bBoxHeight } = rotateSize(
    image.naturalWidth, image.naturalHeight, rotation
  );
  const canvas = document.createElement('canvas');
  let scale = Math.min(1, MAX_DIMENSION / Math.max(pixelCrop.width, pixelCrop.height));

  while (true) {
    canvas.width = Math.max(1, Math.round(pixelCrop.width * scale));
    canvas.height = Math.max(1, Math.round(pixelCrop.height * scale));
    const ctx = canvas.getContext('2d');
    if (!ctx) throw new Error('Could not crop image');

    ctx.fillStyle = '#fff';
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    ctx.scale(canvas.width / pixelCrop.width, canvas.height / pixelCrop.height);
    ctx.translate(-pixelCrop.x, -pixelCrop.y);
    ctx.translate(bBoxWidth / 2, bBoxHeight / 2);
    ctx.rotate(rotRad);
    ctx.translate(-image.naturalWidth / 2, -image.naturalHeight / 2);
    ctx.drawImage(image, 0, 0);

    for (const quality of [0.92, 0.8, 0.65, 0.5, 0.4]) {
      const blob = await canvasToBlob(canvas, quality);
      if (blob.type !== OUTPUT_TYPE) throw new Error('Could not create JPEG photo');
      if (blob.size <= MAX_BYTES) {
        return new File([blob], fileName, { type: OUTPUT_TYPE, lastModified: Date.now() });
      }
    }

    if (canvas.width === 1 && canvas.height === 1) {
      throw new Error('Could not create a photo under 5MB');
    }
    scale *= 0.75;
  }
}
