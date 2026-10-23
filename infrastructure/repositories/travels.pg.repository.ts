import { ITravelRepository } from "../../domain/repositories/ITravelRepository";
import { Travel } from "../../domain/models/Travel";
import prisma from "../database/prismaClient";

/**
 * Implementación concreta del repositorio de Travels usando Prisma + Neon.
 */
export class TravelRepository implements ITravelRepository {
  async findAllTravelsActive(): Promise<Travel[]> {
    const rows = await prisma.travel.findMany({
      where: { isActive: true },
      orderBy: { name: "asc" },
    });
    return rows.map(this.toDomain);
  }

  async findTravelById(id: string): Promise<Travel | null> {
    const row = await prisma.travel.findUnique({ where: { id } });
    return row ? this.toDomain(row) : null;
  }

  async saveTravel(travel: Travel): Promise<Travel> {
    const row = await prisma.travel.create({
      data: {
        id: travel.id,
        name: travel.name,
        description: travel.description,
        durationHours: travel.durationHours,
        highlights: travel.highlights,
        isActive: travel.isActive,
      },
    });
    return this.toDomain(row);
  }

  private toDomain(row: any): Travel {
    return {
      id: row.id,
      name: row.name,
      description: row.description,
      durationHours: row.durationHours,
      highlights: row.highlights,
      isActive: row.isActive,
    };
  }
}
