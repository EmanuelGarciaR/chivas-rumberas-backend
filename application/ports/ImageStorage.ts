/**
 * Puerto para almacenamiento de imágenes (firma de subida directa).
 */
export interface UploadSignatureDto {
  cloudName: string;
  apiKey: string;
  timestamp: number;
  signature: string;
  folder: string;
  allowedFormats: string[];
  maxFileSize: number;
}

export interface ImageStorage {
  generateUploadSignature(): UploadSignatureDto;
}

export type IImageStorage = ImageStorage;
