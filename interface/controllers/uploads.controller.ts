import { Request, Response, NextFunction } from "express";
import { ImageStorage } from "../../application/ports/ImageStorage";

export class UploadsController {
  constructor(private readonly imageStorage: ImageStorage) {}

  getSignature = (_req: Request, res: Response, next: NextFunction): void => {
    try {
      const signatureData = this.imageStorage.generateUploadSignature();
      res.status(200).json(signatureData);
    } catch (err) {
      next(err);
    }
  };
}
