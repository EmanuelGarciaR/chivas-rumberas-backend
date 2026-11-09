import rateLimit from "express-rate-limit";

/**
 * Rate limiter estricto para consulta pública de seguimiento de reservas (/bookings/track).
 * Protege contra enumeración por fuerza bruta de códigos y correos.
 */
export const trackBookingRateLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutos
  max: 15,
  standardHeaders: true,
  legacyHeaders: false,
  message: {
    error: {
      type: "TooManyRequestsError",
      message: "Demasiados intentos de seguimiento. Por favor intenta de nuevo en unos minutos.",
    },
  },
});

/**
 * Rate limiter para inicio de sesión (/auth/login).
 * Protege contra ataques de fuerza bruta sobre credenciales de administrador.
 */
export const loginRateLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutos
  max: 10,
  standardHeaders: true,
  legacyHeaders: false,
  message: {
    error: {
      type: "TooManyRequestsError",
      message: "Demasiados intentos de inicio de sesión. Por favor intenta de nuevo en unos minutos.",
    },
  },
});
