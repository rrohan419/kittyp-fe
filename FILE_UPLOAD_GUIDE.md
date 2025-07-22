# File Upload System Guide

This guide explains how to use the comprehensive file upload system built for the Kittyp React project.

## Overview

The file upload system consists of:
- **File Upload Service** (`src/services/fileUploadService.ts`) - Core upload functionality
- **Generic File Upload Component** (`src/components/ui/FileUpload.tsx`) - Reusable upload component
- **Specialized Components** - Purpose-built components for specific use cases

## Backend Integration

The system integrates with your Spring Boot backend controller at `/upload/public-url` which supports:
- Multiple file uploads
- Admin vs user uploads (different S3 folders)
- Authentication via JWT tokens
- Progress tracking

## File Upload Service

### Core Functions

```typescript
import { 
  uploadFiles, 
  uploadProfilePicture, 
  uploadProductImages, 
  uploadPetPhotos,
  validateFiles,
  fileToBase64,
  resizeImage,
  useFileUpload 
} from '@/services/fileUploadService';
```

### Basic Usage

```typescript
// Upload multiple files
const urls = await uploadFiles(files, {
  isAdminUpload: true,
  onProgress: (progress) => console.log(`${progress.percentage}%`)
});

// Upload profile picture
const url = await uploadProfilePicture(file);

// Upload product images
const urls = await uploadProductImages(files);

// Upload pet photos
const urls = await uploadPetPhotos(files);
```

### File Validation

```typescript
const validation = validateFiles(files, {
  maxFileSize: 5 * 1024 * 1024, // 5MB
  allowedTypes: ['image/jpeg', 'image/png', 'image/webp'],
  maxFiles: 10
});

if (!validation.isValid) {
  console.error(validation.errors);
}
```

### React Hook

```typescript
const { upload, isUploading, progress } = useFileUpload();

const handleUpload = async () => {
  const urls = await upload(files, { isAdminUpload: true });
  console.log('Uploaded URLs:', urls);
};
```

## Components

### 1. Generic FileUpload Component

```tsx
import { FileUpload } from '@/components/ui/FileUpload';

<FileUpload
  onUploadComplete={(urls) => console.log(urls)}
  onUploadError={(error) => console.error(error)}
  options={{
    maxFileSize: 5 * 1024 * 1024,
    allowedTypes: ['image/jpeg', 'image/png'],
    maxFiles: 5
  }}
  variant="drag-drop" // or "button"
  showPreview={true}
  placeholder="Drop files here"
/>
```

### 2. ProfilePictureUpload Component

```tsx
import { ProfilePictureUpload } from '@/components/ui/ProfilePictureUpload';

<ProfilePictureUpload
  currentImageUrl={user.profilePicture}
  onUploadComplete={(url) => updateProfile(url)}
  onUploadError={(error) => console.error(error)}
  userName="John Doe"
  showName={true}
  size="lg" // sm, md, lg
/>
```

### 3. ProductImageUpload Component

```tsx
import { ProductImageUpload } from '@/components/ui/FileUpload';

<ProductImageUpload
  onUploadComplete={(urls) => setProductImages(urls)}
  onUploadError={(error) => console.error(error)}
  maxFiles={10}
/>
```

### 4. PetPhotoUpload Component

```tsx
import { PetPhotoUpload } from '@/components/ui/PetPhotoUpload';

<PetPhotoUpload
  currentPhotos={pet.photos}
  onUploadComplete={(urls) => updatePetPhotos(urls)}
  onUploadError={(error) => console.error(error)}
  petName="Buddy"
  maxPhotos={5}
/>
```

## Use Cases

### 1. User Profile Picture Upload

```tsx
// In Profile.tsx
<ProfilePictureUpload
  onUploadComplete={(url) => {
    // Update user profile with new image URL
    dispatch(updateUserProfile({ profilePicture: url }));
  }}
  userName={`${user.firstName} ${user.lastName}`}
  showName={true}
  size="lg"
/>
```

### 2. Admin Product Creation

```tsx
// In AdminProducts.tsx
<ProductImageUpload
  onUploadComplete={(urls) => {
    setValue('productImageUrls', urls);
  }}
  onUploadError={(error) => {
    toast.error('Failed to upload images');
  }}
/>
```

### 3. Pet Photo Upload

```tsx
// In PetDetailsForm.tsx
<PetPhotoUpload
  currentPhotos={pet.photos}
  onUploadComplete={(urls) => {
    setPetPhotos(urls);
  }}
  petName={pet.name}
  maxPhotos={5}
/>
```

## Configuration

### File Size Limits
- Profile Pictures: 2MB
- Product Images: 5MB
- Pet Photos: 3MB

### Supported Formats
- JPEG (.jpg, .jpeg)
- PNG (.png)
- WebP (.webp)

### Upload Folders
- User uploads: `user-uploads/{email}/`
- Admin uploads: `admin-uploads/`

## Error Handling

The system provides comprehensive error handling:

```typescript
try {
  const urls = await uploadFiles(files);
  // Success
} catch (error) {
  // Error is automatically displayed via toast
  console.error('Upload failed:', error);
}
```

## Progress Tracking

All upload functions support progress tracking:

```typescript
const urls = await uploadFiles(files, {
  onProgress: (progress) => {
    console.log(`Uploaded ${progress.loaded} of ${progress.total} bytes (${progress.percentage}%)`);
  }
});
```

## Image Optimization

The system automatically resizes images before upload:

```typescript
// Resize image to 800x800 with 80% quality
const resizedFile = await resizeImage(file, 800, 800, 0.8);
```

## Security Features

- File type validation
- File size limits
- Authentication required
- Admin vs user upload separation
- Secure S3 storage

## Best Practices

1. **Always validate files** before upload
2. **Show progress indicators** for better UX
3. **Handle errors gracefully** with user-friendly messages
4. **Use appropriate file size limits** for different use cases
5. **Implement proper cleanup** for failed uploads
6. **Test with various file types and sizes**

## Troubleshooting

### Common Issues

1. **Upload fails with 401 error**
   - Check if user is authenticated
   - Verify JWT token is valid

2. **File size too large**
   - Check file size limits
   - Use image compression if needed

3. **Unsupported file type**
   - Verify file extension
   - Check allowed types configuration

4. **Progress not updating**
   - Ensure onProgress callback is provided
   - Check network connectivity

### Debug Mode

Enable debug logging:

```typescript
// In fileUploadService.ts
const DEBUG = true;

if (DEBUG) {
  console.log('Upload progress:', progress);
}
```

## API Reference

### FileUploadOptions
```typescript
interface FileUploadOptions {
  isAdminUpload?: boolean;
  onProgress?: (progress: UploadProgress) => void;
  maxFileSize?: number;
  allowedTypes?: string[];
  maxFiles?: number;
}
```

### UploadProgress
```typescript
interface UploadProgress {
  loaded: number;
  total: number;
  percentage: number;
}
```

### FileValidationResult
```typescript
interface FileValidationResult {
  isValid: boolean;
  errors: string[];
}
```

This file upload system provides a robust, secure, and user-friendly way to handle file uploads across your React application. 