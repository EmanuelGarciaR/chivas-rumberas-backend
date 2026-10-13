/**
 * Entidad: User (Administrador)
 * Solo se usa para el panel de administración del operador.
 * Los clientes NO necesitan cuenta para hacer reservas.
 */
export interface User {
  id: string;
  email: string;
  passwordHash: string;
  role: UserRole;
  createdAt: Date;
}

export type UserRole = "admin" | "operator";
