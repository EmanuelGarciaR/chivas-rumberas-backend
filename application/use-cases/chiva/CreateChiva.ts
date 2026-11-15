import { CreateChivaDto, ChivaResponseDto } from "../../dtos/ChivaDto";
import { ValidationError } from "../../../domain/errors/DomainErrors";
import { Chiva, ChivaStatus } from "../../../domain/models/Chiva";
import { IChivaRepository } from "../../../domain/repositories/IChivaRepository";
import { slugify } from "../../../domain/utils/idGenerator";

const CHIVA_STATUSES: ChivaStatus[] = ["available", "maintenance", "retired"];
const MAX_CHIVA_IMAGES = 10;

export class CreateChivaUseCase {
  constructor(private readonly chivaRepository: IChivaRepository) {}

  async execute(dto: CreateChivaDto): Promise<ChivaResponseDto> {
    const name = dto.name?.trim();
    const description = dto.description?.trim();

    if (!name) {
      throw new ValidationError("El nombre de la chiva es requerido.");
    }
    if (!description) {
      throw new ValidationError("La descripción de la chiva es requerida.");
    }
    if (!Number.isInteger(dto.capacity) || dto.capacity <= 0) {
      throw new ValidationError("capacity debe ser un entero mayor que cero.");
    }
    if (!Number.isFinite(dto.pricePerHour) || dto.pricePerHour <= 0) {
      throw new ValidationError("pricePerHour debe ser un número mayor que cero.");
    }

    const status: ChivaStatus = dto.status ?? "available";
    if (!CHIVA_STATUSES.includes(status)) {
      throw new ValidationError("El estado de la chiva no es válido.");
    }

    const imageUrls = dto.imageUrls ?? [];
    if (!Array.isArray(imageUrls) || imageUrls.length > MAX_CHIVA_IMAGES) {
      throw new ValidationError(`Máximo ${MAX_CHIVA_IMAGES} fotos permitidas por chiva.`);
    }

    const features = dto.features ?? [];
    if (!Array.isArray(features)) {
      throw new ValidationError("features debe ser un arreglo de textos.");
    }

    const baseSlug = slugify(name);
    if (!baseSlug) {
      throw new ValidationError("El nombre proporcionado no genera un identificador válido.");
    }

    let id = baseSlug;
    let suffix = 2;
    while (await this.chivaRepository.findChivaById(id)) {
      id = `${baseSlug}-${suffix}`;
      suffix++;
    }

    const now = new Date();
    const chiva: Chiva = {
      id,
      name,
      description,
      capacity: dto.capacity,
      pricePerHour: dto.pricePerHour,
      status,
      features,
      imageUrls,
      createdAt: now,
      updatedAt: now,
    };

    const created = await this.chivaRepository.saveChiva(chiva);

    return {
      id: created.id,
      name: created.name,
      description: created.description,
      capacity: created.capacity,
      imageUrls: created.imageUrls,
      pricePerHour: created.pricePerHour,
      status: created.status,
      features: created.features,
    };
  }
}
