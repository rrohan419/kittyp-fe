import assert from 'node:assert/strict';
import { describe, it } from 'node:test';
import { PET_FALLBACK_PHOTOS, petFallbackPhotoUrl } from '../../utils/petFallbackPhoto.ts';
import { PET_IMAGE_PLACEHOLDER, resolvePetImageSrc } from './petImageSrc.ts';

describe('resolvePetImageSrc', () => {
  it('prefers profilePicture over photoUrl and photos', () => {
    assert.equal(
      resolvePetImageSrc({
        profilePicture: 'https://cdn.example/parent.jpg',
        photoUrl: 'https://cdn.example/clinic.jpg',
        photos: ['https://cdn.example/gallery.jpg'],
      }),
      'https://cdn.example/parent.jpg'
    );
  });

  it('falls back to photoUrl when profilePicture is blank', () => {
    assert.equal(
      resolvePetImageSrc({
        profilePicture: '  ',
        photoUrl: 'https://cdn.example/clinic.jpg',
      }),
      'https://cdn.example/clinic.jpg'
    );
  });

  it('falls back to photos[0] when profilePicture and photoUrl are missing', () => {
    assert.equal(
      resolvePetImageSrc({
        photos: ['https://cdn.example/gallery.jpg', 'https://cdn.example/other.jpg'],
      }),
      'https://cdn.example/gallery.jpg'
    );
  });

  it('uses the same stock photo for the same pet uuid everywhere', () => {
    const catA = resolvePetImageSrc({ type: 'Cat', uuid: 'pet-1' });
    const catB = resolvePetImageSrc({ type: 'feline', uuid: 'pet-1' });
    assert.equal(catA, catB);
    assert.ok(PET_FALLBACK_PHOTOS.cat.includes(catA));
    assert.equal(
      resolvePetImageSrc({ species: 'Dog', uuid: 'dog-9' }),
      petFallbackPhotoUrl('Dog', 'dog-9')
    );
    assert.equal(
      resolvePetImageSrc({ type: 'rabbit', uuid: 'r-1' }),
      resolvePetImageSrc({ species: 'bunny', uuid: 'r-1' })
    );
    assert.ok(PET_IMAGE_PLACEHOLDER.startsWith('data:image/svg+xml'));
  });

  it('keeps an uploaded photo ahead of the species stock image', () => {
    assert.equal(
      resolvePetImageSrc({
        profilePicture: 'https://cdn.example/parent.jpg',
        type: 'Cat',
        uuid: 'pet-1',
      }),
      'https://cdn.example/parent.jpg'
    );
  });
});
