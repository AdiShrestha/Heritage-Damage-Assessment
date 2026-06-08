import { ALLOWED_TYPES, MAX_FILE_BYTES, MAX_FILE_MB } from '../constants';

export function createPreviewURL(file) {
  return URL.createObjectURL(file);
}

export function revokePreviewURL(url) {
  URL.revokeObjectURL(url);
}

export function validateFile(file) {
  if (!file) {
    return { valid: false, error: 'Please select an image file.' };
  }

  if (!ALLOWED_TYPES.includes(file.type)) {
    return { valid: false, error: 'Unsupported format. Use JPEG, PNG, or WebP.' };
  }

  if (file.size > MAX_FILE_BYTES) {
    return {
      valid: false,
      error: `File is too large. Maximum size is ${MAX_FILE_MB}MB.`,
    };
  }

  return { valid: true, error: null };
}

export function formatFileSize(bytes) {
  if (bytes < 1024) {
    return `${bytes} B`;
  }

  if (bytes < 1024 * 1024) {
    return `${(bytes / 1024).toFixed(bytes < 10240 ? 1 : 0)} KB`;
  }

  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}
