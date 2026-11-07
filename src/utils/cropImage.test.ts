import assert from 'node:assert/strict';
import { after, describe, it } from 'node:test';
import { getCroppedImageFile } from './cropImage.ts';

const originalImage = Object.getOwnPropertyDescriptor(globalThis, 'Image');
const originalDocument = Object.getOwnPropertyDescriptor(globalThis, 'document');

after(() => {
  if (originalImage) Object.defineProperty(globalThis, 'Image', originalImage);
  else Reflect.deleteProperty(globalThis, 'Image');
  if (originalDocument) Object.defineProperty(globalThis, 'document', originalDocument);
  else Reflect.deleteProperty(globalThis, 'document');
});

describe('getCroppedImageFile', () => {
  it('encodes a bounded JPEG, reducing quality and dimensions when needed', async () => {
    const calls: { width: number; height: number; quality: number }[] = [];
    const transforms: string[] = [];
    class FakeImage {
      naturalWidth = 8000;
      naturalHeight = 6000;
      addEventListener(event: string, handler: () => void) {
        if (event === 'load') this.load = handler;
      }
      load = () => {};
      set src(_url: string) { this.load(); }
    }
    const canvas = {
      width: 0,
      height: 0,
      getContext: () => ({
        fillStyle: '',
        fillRect: () => {},
        scale: () => transforms.push('scale'),
        translate: () => transforms.push('translate'),
        rotate: (angle: number) => transforms.push(`rotate:${angle}`),
        drawImage: () => transforms.push('draw'),
      }),
      toBlob: (callback: (blob: Blob) => void, type: string, quality: number) => {
        calls.push({ width: canvas.width, height: canvas.height, quality });
        const bytes = canvas.width > 3072 ? 5 * 1024 * 1024 + 1 : 1024;
        callback(new Blob([new Uint8Array(bytes)], { type }));
      },
    };
    Object.defineProperty(globalThis, 'Image', { configurable: true, value: FakeImage });
    Object.defineProperty(globalThis, 'document', {
      configurable: true,
      value: { createElement: () => canvas },
    });

    const result = await getCroppedImageFile(
      'blob:photo', { x: 100, y: 200, width: 5000, height: 5000 }, 90, 'pet.png'
    );

    assert.equal(result.name, 'pet.png');
    assert.equal(result.type, 'image/jpeg');
    assert.ok(result.size <= 5 * 1024 * 1024);
    assert.deepEqual(calls.map(({ width, height, quality }) => [width, height, quality]), [
      [4096, 4096, 0.92], [4096, 4096, 0.8], [4096, 4096, 0.65],
      [4096, 4096, 0.5], [4096, 4096, 0.4], [3072, 3072, 0.92],
    ]);
    assert.ok(transforms.includes(`rotate:${Math.PI / 2}`));
  });

  it('rejects invalid crop areas before loading the image', async () => {
    await assert.rejects(
      getCroppedImageFile('blob:photo', { x: 0, y: 0, width: 0, height: 100 }),
      /Invalid crop area/
    );
  });

  it('reports an image load failure', async () => {
    class BrokenImage {
      error = () => {};
      addEventListener(event: string, handler: () => void) {
        if (event === 'error') this.error = handler;
      }
      set src(_url: string) { this.error(); }
    }
    Object.defineProperty(globalThis, 'Image', { configurable: true, value: BrokenImage });
    await assert.rejects(
      getCroppedImageFile('blob:broken', { x: 0, y: 0, width: 10, height: 10 }),
      /Could not load photo/
    );
  });
});
