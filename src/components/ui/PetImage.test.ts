import assert from 'node:assert/strict';
import { describe, it } from 'node:test';
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

  it('uses the placeholder data URI when every field is blank or null', () => {
    assert.equal(resolvePetImageSrc({}), PET_IMAGE_PLACEHOLDER);
    assert.equal(resolvePetImageSrc({ profilePicture: null, photoUrl: '', photos: [] }), PET_IMAGE_PLACEHOLDER);
    assert.equal(resolvePetImageSrc({ profilePicture: '   ', photos: [null, ''] }), PET_IMAGE_PLACEHOLDER);
    assert.ok(PET_IMAGE_PLACEHOLDER.startsWith('data:image/svg+xml'));
  });
});
