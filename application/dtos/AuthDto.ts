import { UserRole } from "../../domain/models/User";

/**
 * DTO de entrada: credenciales de login.
  Contraseña que el usuario escribe en el formulario.
  NUNCA se persiste — existe solo en memoria durante el login.
  bcrypt.compare() la coteja contra el hash almacenado en DB sin revertirlo.
 */
export interface LoginDto {
  email: string;
  password: string;
}

/**
 * DTO de salida: respuesta exitosa del login.
 */
export interface AuthResponseDto {
  accessToken: string;  // JWT firmado
  user: {
    id: string;
    email: string;
    role: UserRole;
  };
}
