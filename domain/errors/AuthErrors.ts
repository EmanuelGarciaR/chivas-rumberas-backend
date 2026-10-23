/**
 * Error: credenciales inválidas en el login.
 * No se distingue si el error es email o contraseña (buena práctica de seguridad).
 */
export class InvalidCredentialsError extends Error {
  constructor() {
    super("Email o contraseña incorrectos.");
    this.name = "InvalidCredentialsError";
  }
}

/**
 * Error: token JWT inválido o expirado.
 */
export class InvalidTokenError extends Error {
  constructor() {
    super("Token inválido o expirado.");
    this.name = "InvalidTokenError";
  }
}

/**
 * Error: el usuario no tiene permisos para esta acción.
 */
export class UnauthorizedError extends Error {
  constructor() {
    super("No tienes permisos para realizar esta acción.");
    this.name = "UnauthorizedError";
  }
}
