import crypto from "node:crypto";
import { ImageStorage, UploadSignatureDto } from "../../application/ports/ImageStorage";

const DEFAULT_FOLDER = "chivas-rumberas/chivas";
const ALLOWED_FORMATS = ["jpg", "png", "webp"];
const MAX_FILE_SIZE_BYTES = 5 * 1024 * 1024; // 5 MB

/**
 * Adaptador de Cloudinary para subida directa firmada desde el navegador.
 */
export class CloudinaryImageStorage implements ImageStorage {
  generateUploadSignature(): UploadSignatureDto {
    const cloudName = (process.env.CLOUDINARY_CLOUD_NAME ?? "")
      .trim()
      .replace(/^["']+|["']+$/g, "");
    const apiKey = (process.env.CLOUDINARY_API_KEY ?? "")
      .trim()
      .replace(/^["']+|["']+$/g, "");
    const apiSecret = (process.env.CLOUDINARY_API_SECRET ?? "")
      .trim()
      .replace(/^["']+|["']+$/g, "");

    if (!cloudName || !apiKey || !apiSecret) {
      throw new Error(
        "Las credenciales de Cloudinary (CLOUDINARY_CLOUD_NAME, CLOUDINARY_API_KEY, CLOUDINARY_API_SECRET) no están configuradas."
      );
    }

    const timestamp = Math.floor(Date.now() / 1000);
    const folder = DEFAULT_FOLDER;
    const allowedFormats = ALLOWED_FORMATS;
    const maxFileSize = MAX_FILE_SIZE_BYTES;

    // Cloudinary exige firmar únicamente los parámetros que el frontend envía en el FormData
    // (folder y timestamp), ordenados alfabéticamente.
    const paramsToSign: Record<string, string | number> = {
      folder,
      timestamp,
    };

    const sortedParams = Object.keys(paramsToSign)
      .sort()
      .map((key) => `${key}=${paramsToSign[key]}`)
      .join("&");

    const signature = crypto
      .createHash("sha1")
      .update(`${sortedParams}${apiSecret}`)
      .digest("hex");

    return {
      cloudName,
      apiKey,
      timestamp,
      signature,
      folder,
      allowedFormats,
      maxFileSize,
    };
  }
}
