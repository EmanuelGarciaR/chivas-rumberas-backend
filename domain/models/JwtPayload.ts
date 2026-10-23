import { UserRole } from "./User";

/**
 * Payload que se embebe dentro del JWT.
 * Contiene solo lo mínimo necesario (no incluye passwordHash).
 */
export interface JwtPayload {
  sub: string;      // ID del usuario
  email: string;
  role: UserRole;
  iat?: number;     // issued at (lo agrega jsonwebtoken automáticamente)
  exp?: number;     // expiration (lo agrega jsonwebtoken automáticamente)
}
