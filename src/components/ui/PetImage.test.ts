import assert from 'node:assert/strict';
import { describe, it } from 'node:test';
import { PET_FALLBACK_PHOTOS } from '../../utils/petFallbackPhoto.ts';
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

  it('rotates stock photos by list index within the species set', () => {
    assert.equal(resolvePetImageSrc({ type: 'Cat' }, 0), PET_FALLBACK_PHOTOS.cat[0]);
    assert.equal(resolvePetImageSrc({ type: 'Cat' }, 1), PET_FALLBACK_PHOTOS.cat[1]);
    assert.equal(resolvePetImageSrc({ type: 'feline' }, 5), PET_FALLBACK_PHOTOS.cat[0]);
    assert.equal(resolvePetImageSrc({ species: 'Dog' }, 2), PET_FALLBACK_PHOTOS.dog[2]);
    assert.equal(resolvePetImageSrc({ species: 'canine' }, 4), PET_FALLBACK_PHOTOS.dog[4]);
    assert.equal(resolvePetImageSrc({ type: 'rabbit' }, 3), PET_FALLBACK_PHOTOS.rabbit[3]);
    assert.equal(resolvePetImageSrc({ species: 'Bird' }, 6), PET_FALLBACK_PHOTOS.bird[1]);
    assert.equal(resolvePetImageSrc({}), PET_FALLBACK_PHOTOS.other[0]);
    assert.equal(
      resolvePetImageSrc({ profilePicture: null, photoUrl: '', photos: [], type: 'other' }, 2),
      PET_FALLBACK_PHOTOS.other[2]
    );
    assert.equal(
      resolvePetImageSrc({ profilePicture: '   ', photos: [null, ''], species: 'rabbit' }, 4),
      PET_FALLBACK_PHOTOS.rabbit[4]
    );
    assert.ok(PET_IMAGE_PLACEHOLDER.startsWith('data:image/svg+xml'));
  });

  it('keeps an uploaded photo ahead of the species stock image', () => {
    assert.equal(
      resolvePetImageSrc({
        profilePicture: 'https://cdn.example/parent.jpg',
        type: 'Cat',
      }),
      'https://cdn.example/parent.jpg'
    );
  });
});
