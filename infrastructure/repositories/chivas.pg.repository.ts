import { IChivaRepository } from "../../domain/repositories/IChivaRepository";
import { Chiva, ChivaStatus } from "../../domain/models/Chiva";
import prisma from "../database/prismaClient";

/**
 * Implementación concreta del repositorio de Chivas usando Prisma + Neon.
 */
export class ChivaRepository implements IChivaRepository {
  async findChivaAll(status?: ChivaStatus): Promise<Chiva[]> {
    const rows = await prisma.chiva.findMany({
      where: status ? { status } : undefined,
      orderBy: { createdAt: "asc" },
    });
    return rows.map(this.toDomain);
  }

  async findById(id: string): Promise<Chiva | null> {
    const row = await prisma.chiva.findUnique({ where: { id } });
    return row ? this.toDomain(row) : null;
  }

  async saveChiva(chiva: Chiva): Promise<Chiva> {
    const row = await prisma.chiva.create({
      data: {
        id: chiva.id,
        name: chiva.name,
        description: chiva.description,
        capacity: chiva.capacity,
        imageUrls: chiva.imageUrls,
        pricePerHour: chiva.pricePerHour,
        status: chiva.status,
        features: chiva.features,
      },
    });
    return this.toDomain(row);
  }

  async updateChivaStatus(id: string, status: ChivaStatus): Promise<Chiva> {
    const row = await prisma.chiva.update({
      where: { id },
      data: { status },
    });
    return this.toDomain(row);
  }

  /** Mapea la fila de Prisma al modelo de dominio */
  private toDomain(row: any): Chiva {
    return {
      id: row.id,
      name: row.name,
      description: row.description,
      capacity: row.capacity,
      imageUrls: row.imageUrls,
      pricePerHour: row.pricePerHour,
      status: row.status as ChivaStatus,
      features: row.features,
      createdAt: row.createdAt,
      updatedAt: row.updatedAt,
    };
  }
}
