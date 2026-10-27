import { Request, Response, NextFunction } from "express";
import { DomainError } from "../../domain/errors/DomainErrors";
import { InvalidCredentialsError, InvalidTokenError, UnauthorizedError } from "../../domain/errors/AuthErrors";

/**
 * Mapea los errores de dominio a sus códigos HTTP correspondientes.
 */
const domainErrorToStatus = (error: Error): number => {
  const name = error.constructor.name;

  const statusMap: Record<string, number> = {
    // 404 — Not Found
    ChivaNotFoundError: 404,
    BookingNotFoundError: 404,
    TravelNotFoundError: 404,

    // 409 — Conflict
    ChivaNotAvailableError: 409,
    BookingConflictError: 409,

    // 422 — Unprocessable Entity
    InvalidBookingStatusTransitionError: 422,

    // 400 — Bad Request
    ValidationError: 400,

    // 401 — Unauthorized
    InvalidCredentialsError: 401,
    InvalidTokenError: 401,

    // 403 — Forbidden
    UnauthorizedError: 403,
  };

  return statusMap[name] ?? 400;
};

/**
 * Middleware global de manejo de errores.
 * Debe registrarse ÚLTIMO en app.ts (después de todas las rutas).
 */
export const errorHandler = (
  err: Error,
  _req: Request,
  res: Response,
  _next: NextFunction
): void => {
  // Errores de dominio conocidos
  if (
    err instanceof DomainError ||
    err instanceof InvalidCredentialsError ||
    err instanceof InvalidTokenError ||
    err instanceof UnauthorizedError
  ) {
    res.status(domainErrorToStatus(err)).json({
      error: {
        type: err.constructor.name,
        message: err.message,
      },
    });
    return;
  }

  // Error desconocido — no exponer detalles internos en producción
  console.error("[ERROR]", err);
  res.status(500).json({
    error: {
      type: "InternalServerError",
      message:
        process.env.NODE_ENV === "development"
          ? err.message
          : "Ocurrió un error interno en el servidor.",
    },
  });
};
