import { IUserRepository } from "../../domain/repositories/IUserRepository";
import { User, UserRole } from "../../domain/models/User";
import prisma from "../database/prismaClient";

/**
 * Implementación concreta del repositorio de Usuarios usando Prisma + Neon.
 */
export class UserRepository implements IUserRepository {
  async findUserByEmail(email: string): Promise<User | null> {
    const row = await prisma.user.findUnique({ where: { email } });
    return row ? this.toDomain(row) : null;
  }

  async findUserById(id: string): Promise<User | null> {
    const row = await prisma.user.findUnique({ where: { id } });
    return row ? this.toDomain(row) : null;
  }

  async saveUser(user: User): Promise<User> {
    const row = await prisma.user.create({
      data: {
        id: user.id,
        email: user.email,
        passwordHash: user.passwordHash,
        role: user.role,
      },
    });
    return this.toDomain(row);
  }

  private toDomain(row: any): User {
    return {
      id: row.id,
      email: row.email,
      passwordHash: row.passwordHash,
      role: row.role as UserRole,
      createdAt: row.createdAt,
    };
  }
}
