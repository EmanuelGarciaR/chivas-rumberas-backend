import { Request, Response, NextFunction } from "express";
import { z } from "zod";
import { GetChivasUseCase } from "../../application/use-cases/chiva/GetChivas";
import { GetChivaByIdUseCase } from "../../application/use-cases/chiva/GetChivaById";
import { ChivaStatus } from "../../domain/models/Chiva";
import { UpdateChivaUseCase } from "../../application/use-cases/chiva/UpdateChiva";
import { UpdateChivaStatusUseCase } from "../../application/use-cases/chiva/UpdateChivaStatus";
import { CreateChivaUseCase } from "../../application/use-cases/chiva/CreateChiva";
import { DeleteChivaUseCase } from "../../application/use-cases/chiva/DeleteChiva";
import { ValidationError } from "../../domain/errors/DomainErrors";

const CHIVA_STATUSES: ChivaStatus[] = ["available", "maintenance", "retired"];

const createChivaSchema = z.object({
  name: z
    .string({ message: "El nombre es requerido." })
    .trim()
    .min(1, "El nombre no puede estar vacío."),
  description: z
    .string({ message: "La descripción es requerida." })
    .trim()
    .min(1, "La descripción no puede estar vacía."),
  capacity: z
    .number({ message: "capacity debe ser un número." })
    .int("capacity debe ser un número entero.")
    .positive("capacity debe ser mayor que cero."),
  pricePerHour: z
    .number({ message: "pricePerHour debe ser un número." })
    .positive("pricePerHour debe ser mayor que cero."),
  features: z
    .array(z.string().trim().min(1))
    .optional()
    .default([]),
  status: z
    .enum(["available", "maintenance", "retired"], {
      message: "El estado de la chiva no es válido.",
    })
    .optional()
    .default("available"),
  imageUrls: z
    .array(z.string().url("Cada elemento de imageUrls debe ser una URL válida."))
    .max(10, "Máximo 10 fotos permitidas por chiva.")
    .optional()
    .default([]),
});

const updateChivaSchema = z
  .object({
    name: z.string().trim().min(1, "El nombre no puede estar vacío.").optional(),
    description: z.string().trim().min(1, "La descripción no puede estar vacía.").optional(),
    capacity: z
      .number()
      .int("capacity debe ser un número entero.")
      .positive("capacity debe ser mayor que cero.")
      .optional(),
    pricePerHour: z
      .number()
      .positive("pricePerHour debe ser mayor que cero.")
      .optional(),
    features: z.array(z.string().trim().min(1)).optional(),
    status: z
      .enum(["available", "maintenance", "retired"], {
        message: "El estado de la chiva no es válido.",
      })
      .optional(),
    imageUrls: z
      .array(z.string().url("Cada elemento de imageUrls debe ser una URL válida."))
      .max(10, "Máximo 10 fotos permitidas por chiva.")
      .optional(),
  })
  .refine(
    (data) =>
      data.name !== undefined ||
      data.description !== undefined ||
      data.capacity !== undefined ||
      data.pricePerHour !== undefined ||
      data.features !== undefined ||
      data.status !== undefined ||
      data.imageUrls !== undefined,
    {
      message: "Debe proporcionar al menos un campo para actualizar.",
    }
  );

export class ChivasController {
  constructor(
    private readonly getChivasUseCase: GetChivasUseCase,
    private readonly getChivaByIdUseCase: GetChivaByIdUseCase,
    private readonly updateChivaUseCase: UpdateChivaUseCase,
    private readonly updateChivaStatusUseCase: UpdateChivaStatusUseCase,
    private readonly createChivaUseCase?: CreateChivaUseCase,
    private readonly deleteChivaUseCase?: DeleteChivaUseCase
  ) {}

  getAll = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const status = req.query.status as ChivaStatus | undefined;
      const chivas = await this.getChivasUseCase.execute(status);
      res.status(200).json(chivas);
    } catch (err) {
      next(err);
    }
  };

  getById = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const id = req.params.id as string;
      const chiva = await this.getChivaByIdUseCase.execute(id);
      res.status(200).json(chiva);
    } catch (err) {
      next(err);
    }
  };

  create = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const parsed = createChivaSchema.safeParse(req.body ?? {});
      if (!parsed.success) {
        const message = parsed.error.issues[0]?.message ?? "Datos de chiva inválidos.";
        throw new ValidationError(message);
      }

      if (!this.createChivaUseCase) {
        throw new Error("CreateChivaUseCase no configurado.");
      }

      const chiva = await this.createChivaUseCase.execute(parsed.data);
      res.status(201).json(chiva);
    } catch (err) {
      next(err);
    }
  };

  update = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const id = req.params.id as string;
      const parsed = updateChivaSchema.safeParse(req.body ?? {});
      if (!parsed.success) {
        const message = parsed.error.issues[0]?.message ?? "Datos de actualización inválidos.";
        throw new ValidationError(message);
      }

      const chiva = await this.updateChivaUseCase.execute(id, parsed.data);
      res.status(200).json(chiva);
    } catch (err) {
      next(err);
    }
  };

  delete = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const id = req.params.id as string;
      if (!id || !id.trim()) {
        throw new ValidationError("El id de la chiva es requerido.");
      }

      if (!this.deleteChivaUseCase) {
        throw new Error("DeleteChivaUseCase no configurado.");
      }

      const chiva = await this.deleteChivaUseCase.execute(id);
      res.status(200).json(chiva);
    } catch (err) {
      next(err);
    }
  };

  updateStatus = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const id = req.params.id as string;
      if (!id || !id.trim()) {
        throw new ValidationError("El id de la chiva es requerido.");
      }

      const { status } = req.body ?? {};
      if (!status) {
        throw new ValidationError("El campo status es requerido.");
      }

      if (typeof status !== "string" || !CHIVA_STATUSES.includes(status as ChivaStatus)) {
        throw new ValidationError("El estado de la chiva no es válido.");
      }

      const chiva = await this.updateChivaStatusUseCase.execute(id, status as ChivaStatus);
      res.status(200).json(chiva);
    } catch (err) {
      next(err);
    }
  };
}
