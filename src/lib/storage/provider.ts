export interface UploadResult {
  url: string;
}

/**
 * Swappable file storage — mirrors the payments/notifications provider
 * pattern from Phase 1. LocalStorageProvider writes to /public/uploads for
 * development; a CloudStorageProvider (S3/Cloudinary) can implement the same
 * interface for production without touching any calling code.
 */
export interface StorageProvider {
  upload(file: File): Promise<UploadResult>;
}
