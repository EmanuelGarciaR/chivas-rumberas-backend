import jwt from "jsonwebtoken";
import { IJwtService } from "../../application/ports/IJwtService";
import { JwtPayload } from "../../domain/models/JwtPayload";
import { InvalidTokenError } from "../../domain/errors/AuthErrors";

/**
 * Implementación concreta del servicio JWT usando la librería `jsonwebtoken`.
 * Lee el secreto y la expiración desde variables de entorno.
 */
export class JwtService implements IJwtService {
  private readonly secret: string;
  private readonly expiresIn: string;

  constructor() {
    const secret = process.env.JWT_SECRET;
    if (!secret) {
      throw new Error("Error con la configuración");
    }
    this.secret = secret;
    this.expiresIn = process.env.JWT_EXPIRES_IN ?? "4h";
  }

  sign(payload: JwtPayload): string {
    return jwt.sign(payload, this.secret, { expiresIn: this.expiresIn } as jwt.SignOptions);
  }

  verify(token: string): JwtPayload {
    try {
      return jwt.verify(token, this.secret) as JwtPayload;
    } catch {
      throw new InvalidTokenError();
    }
  }
}
