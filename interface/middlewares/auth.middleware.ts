import { Request, Response, NextFunction } from "express";
import { IJwtService } from "../../application/ports/IJwtService";
import { InvalidTokenError, UnauthorizedError } from "../../domain/errors/AuthErrors";
import { UserRole } from "../../domain/models/User";

/**
 * Extiende Request de Express para incluir el payload del JWT decodificado.
 */
export interface AuthRequest extends Request {
  user?: {
    sub: string;
    email: string;
    role: UserRole;
  };
}

/**
 * Middleware que verifica el JWT en el header Authorization.
 * Si el token es válido, inyecta el payload en req.user y llama a next().
 * Si no, responde con 401.
 */
export const createAuthMiddleware = (jwtService: IJwtService) => {
  return (req: AuthRequest, _res: Response, next: NextFunction): void => {
    const authHeader = req.headers.authorization;

    if (!authHeader || !authHeader.startsWith("Bearer ")) {
      return next(new InvalidTokenError());
    }

    const token = authHeader.split(" ")[1];

    try {
      const payload = jwtService.verify(token);
      req.user = {
        sub: payload.sub,
        email: payload.email,
        role: payload.role,
      };
      next();
    } catch {
      next(new InvalidTokenError());
    }
  };
};

/**
 * Middleware para verificar que el usuario tiene el rol requerido.
 * Debe usarse DESPUÉS de authMiddleware.
 */
export const requireRole = (...roles: UserRole[]) => {
  return (req: AuthRequest, _res: Response, next: NextFunction): void => {
    if (!req.user || !roles.includes(req.user.role)) {
      return next(new UnauthorizedError());
    }
    next();
  };
};
