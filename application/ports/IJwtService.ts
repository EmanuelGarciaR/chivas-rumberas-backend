import { JwtPayload } from "../../domain/models/JwtPayload";

/**
 * Puerto: servicio de JWT.
 * La capa de aplicación depende de esta interfaz, no de `jsonwebtoken` directamente.
 * Esto permite cambiar la librería de JWT sin tocar casos de uso.
 */
export interface IJwtService {
  /** Firma un payload y devuelve el token JWT */
  sign(payload: JwtPayload): string;

  /** Verifica y decodifica un token. Lanza InvalidTokenError si es inválido/expirado */
  verify(token: string): JwtPayload;
}
