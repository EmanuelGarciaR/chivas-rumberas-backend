import { User } from "../models/User";

/**
 * Contrato del repositorio de Usuarios.
 * Solo usado para autenticación del panel admin.
 */
export interface IUserRepository {
  /** Busca un usuario por email (para el login) */
  findUserByEmail(email: string): Promise<User | null>;

  /** Busca un usuario por ID (para validar el token) */
  findUserById(id: string): Promise<User | null>;

  /** Persiste un nuevo usuario */
  saveUser(user: User): Promise<User>;
}
