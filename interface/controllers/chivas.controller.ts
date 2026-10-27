import { Request, Response, NextFunction } from "express";
import { GetChivasUseCase } from "../../application/use-cases/chiva/GetChivas";
import { GetChivaByIdUseCase } from "../../application/use-cases/chiva/GetChivaById";
import { ChivaStatus } from "../../domain/models/Chiva";
import { UpdateChivaUseCase } from "../../application/use-cases/chiva/UpdateChiva";
import { UpdateChivaDto } from "../../application/dtos/ChivaDto";
import { UpdateChivaStatusUseCase } from "../../application/use-cases/chiva/UpdateChivaStatus";
import { ValidationError } from "../../domain/errors/DomainErrors";

const CHIVA_STATUSES: ChivaStatus[] = ["available", "maintenance", "retired"];

export class ChivasController {
  constructor(
    private readonly getChivasUseCase: GetChivasUseCase,
    private readonly getChivaByIdUseCase: GetChivaByIdUseCase,
    private readonly updateChivaUseCase: UpdateChivaUseCase,
    private readonly updateChivaStatusUseCase: UpdateChivaStatusUseCase
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

  update = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const id = req.params.id as string;
      const updates = req.body as UpdateChivaDto;
      const chiva = await this.updateChivaUseCase.execute(id, updates);
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
